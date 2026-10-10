import {
  recordMasteryReview,
  masteredSkills,
  masteryProgress,
} from './mastery.ts';
import {
  BKT_PARAMETERS,
  MASTERY_VERSION,
  MIN_EVIDENCE,
  READY_THRESHOLD,
} from '../../../packages/learning-engine/src/mastery.ts';
import { studentQuestion } from './question-view.ts';
import { evaluateQuestion } from '../../../packages/question-bank/src/grading.ts';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { z, ZodError } from 'zod';
import {
  randomUUID,
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import type { DB } from '../../../packages/database/src/local.ts';
import {
  asDatabase,
  Database,
  transaction,
} from '../../../packages/database/src/adapter.ts';
import {
  assignmentSchema,
  classroomSchema,
  confirmSchema,
  enrollmentSchema,
  reviewSchema,
  roleSchema,
  transcriptionSchema,
  transition,
  type SubmissionState,
} from '../../../packages/contracts/src/index.ts';
import {
  demoQuestion,
  generateQuestion,
  skills,
  type Question,
} from '../../../packages/question-bank/src/index.ts';
import {
  MathIssue,
  type Evaluation,
} from '../../../packages/math-engine/src/index.ts';
import { recommend } from '../../../packages/learning-engine/src/index.ts';
import { validateImage } from '../../../packages/vision-adapter/src/index.ts';
import sharp from 'sharp';
import {
  StorageUnavailable,
  type ImageStore,
} from '../../../packages/vision-adapter/src/storage.ts';
import { saveImage, readImage } from './images.ts';
import { enqueueOcr, manualEntry, OcrJobError } from './ocr.ts';
import type { VisionProvider } from '../../../packages/vision-adapter/src/index.ts';
type User = {
  id: string;
  username: string;
  role: 'teacher' | 'student';
  demo_space: string | null;
  password_hash: string | null;
};
type Classroom = {
  id: string;
  owner_id: string;
  name: string;
  code: string;
};
type Assignment = {
  id: string;
  classroom_id: string;
  title: string;
  question: string;
  feedback: string;
  due_at: string | null;
};
type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  state: SubmissionState;
  version: number;
  classroom_id: string;
  question: string;
  feedback: string;
};
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const now = () => new Date().toISOString();
const fail = (
  status: 400 | 401 | 403 | 404 | 409 | 429 | 503,
  code: string,
): never => {
  throw new HTTPException(status, { message: code });
};
export function createApp(
  input: DB | Database,
  options: {
    allowedOrigins?: string[];
    imageStore?: ImageStore;
    visionProvider?: VisionProvider;
  } = {},
) {
  const db = asDatabase(input);
  const app = new Hono<{
    Variables: {
      user: User;
      requestId: string;
    };
  }>();
  const buckets = new Map<
    string,
    {
      count: number;
      until: number;
    }
  >();
  app.use('*', async (c, next) => {
    c.set('requestId', randomUUID());
    c.header('X-Request-Id', c.get('requestId'));
    c.header('Cache-Control', 'no-store');
    c.header('X-Content-Type-Options', 'nosniff');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) &&
      !(options.allowedOrigins ?? [new URL(c.req.url).origin]).includes(
        c.req.header('origin') ?? '',
      )
    )
      fail(403, 'ORIGIN_REQUIRED');
    await next();
  });
  app.use(
    '*',
    bodyLimit({
      maxSize: 5 * 1024 * 1024,
      onError: (c) => c.json({ error: 'BODY_TOO_LARGE' }, 413),
    }),
  );
  app.use('*', async (c, next) => {
    const rollback = Symbol('rollback response');
    try {
      await db.transaction(async () => {
        await next();
        if (c.res.status >= 400) throw rollback;
      }, !['GET', 'HEAD'].includes(c.req.method));
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
  app.use('*', async (c, next) => {
    const token = getCookie(c, 'tracelab_session');
    const user = token
      ? ((await db
          .prepare(
            'SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?',
          )
          .get(hash(token), Date.now())) as User | undefined)
      : undefined;
    if (user) c.set('user', user);
    // Global anonymous cap is intentionally conservative for a local demo. Hosted rate limits must use a trusted edge identity.
    const key = user?.id ?? 'anonymous';
    if (buckets.size > 10000) {
      for (const [id, v] of buckets)
        if (v.until <= Date.now()) buckets.delete(id);
    }
    const old = buckets.get(key),
      bucket =
        old && old.until > Date.now()
          ? old
          : { count: 0, until: Date.now() + 60000 };
    bucket.count++;
    buckets.set(key, bucket);
    if (bucket.count > 120) fail(429, 'RATE_LIMITED');
    if (
      !user &&
      ![
        '/api/health',
        '/api/auth/register',
        '/api/auth/login',
        '/api/demo',
        '/api/skills',
      ].includes(c.req.path)
    )
      fail(401, 'AUTHENTICATION_REQUIRED');
    await next();
  });
  app.onError((e, c) => {
    if (e instanceof StorageUnavailable)
      return c.json({ error: e.message, requestId: c.get('requestId') }, 503);
    if (e instanceof ZodError)
      return c.json(
        {
          error: 'INVALID_INPUT',
          issues: e.issues.map((i) => ({ path: i.path, message: i.message })),
          requestId: c.get('requestId'),
        },
        400,
      );
    if (e instanceof SyntaxError || e instanceof MathIssue)
      return c.json(
        { error: 'INVALID_INPUT', requestId: c.get('requestId') },
        400,
      );
    if (e instanceof HTTPException)
      return c.json(
        { error: e.message, requestId: c.get('requestId') },
        e.status,
      );
    console.error(
      JSON.stringify({
        request_id: c.get('requestId'),
        error_code: 'INTERNAL_ERROR',
      }),
    );
    return c.json(
      { error: 'INTERNAL_ERROR', requestId: c.get('requestId') },
      500,
    );
  });
  async function event(
    classroom: string,
    submission: string | null,
    type: string,
    payload: object = {},
  ) {
    await db
      .prepare(
        'INSERT INTO domain_events(id,classroom_id,submission_id,type,payload,created_at) VALUES(?,?,?,?,?,?)',
      )
      .run(
        randomUUID(),
        classroom,
        submission,
        type,
        JSON.stringify(payload),
        now(),
      );
  }
  async function classroom(id: string, u: User, ownerOnly = false) {
    const room = (await db
      .prepare('SELECT * FROM classrooms WHERE id=?')
      .get(id)) as Classroom | undefined;
    if (
      !room ||
      (room.owner_id !== u.id &&
        (ownerOnly ||
          !(await db
            .prepare(
              'SELECT 1 FROM classroom_memberships WHERE classroom_id=? AND user_id=?',
            )
            .get(id, u.id))))
    )
      fail(404, 'CLASSROOM_NOT_FOUND');
    return room!;
  }
  async function submission(id: string, u: User, studentOnly = false) {
    const s = (await db
      .prepare(
        'SELECT s.*,a.classroom_id,a.question,a.feedback FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.id=?',
      )
      .get(id)) as Submission | undefined;
    if (!s) fail(404, 'SUBMISSION_NOT_FOUND');
    if (s!.student_id !== u.id) {
      if (studentOnly) fail(404, 'SUBMISSION_NOT_FOUND');
      await classroom(s!.classroom_id, u, true);
    }
    return s!;
  }
  async function move(s: Submission, state: SubmissionState) {
    transition(s.state, state);
    await db
      .prepare('UPDATE submissions SET state=? WHERE id=?')
      .run(state, s.id);
    s.state = state;
  }
  const authSchema = z
    .object({
      username: z.string().regex(/^[a-zA-Z0-9_-]{3,40}$/),
      password: z.string().min(12).max(128),
    })
    .strict();
  function passwordHash(password: string) {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }
  async function setSession(c: Parameters<typeof getCookie>[0], id: string) {
    const token = randomBytes(32).toString('hex');
    const old = getCookie(c, 'tracelab_session');
    if (old)
      await db
        .prepare('DELETE FROM sessions WHERE token_hash=?')
        .run(hash(old));
    await db
      .prepare('DELETE FROM sessions WHERE expires_at<=?')
      .run(Date.now());
    await db
      .prepare('INSERT INTO sessions VALUES(?,?,?)')
      .run(hash(token), id, Date.now() + 8 * 3600000);
    setCookie(c, 'tracelab_session', token, {
      httpOnly: true,
      sameSite: 'Strict',
      secure:
        new URL(c.req.header('origin') ?? c.req.url).protocol === 'https:',
      path: '/',
      maxAge: 8 * 3600,
    });
  }
  app.get('/api/health', async (c) => {
    await db.prepare('SELECT 1').get();
    return c.json({
      status: 'ok',
      persistence: db.kind,
      imageStorage: options.imageStore?.kind ?? 'private-database',
      ocr: options.visionProvider ? 'available' : 'unavailable',
      version: '0.1.0',
    });
  });
  app.get('/api/skills', async (c) => c.json(skills));
  app.post('/api/auth/register', async (c) => {
    const body = authSchema
      .extend({ role: roleSchema })
      .parse(await c.req.json());
    const username = body.username.toLowerCase();
    if (await db.prepare('SELECT 1 FROM users WHERE username=?').get(username))
      fail(409, 'USERNAME_UNAVAILABLE');
    const id = randomUUID();
    await db
      .prepare('INSERT INTO users VALUES(?,?,?,?,?,?)')
      .run(id, username, passwordHash(body.password), body.role, null, now());
    await setSession(c, id);
    return c.json({ id, username, role: body.role }, 201);
  });
  app.post('/api/auth/login', async (c) => {
    const body = authSchema.parse(await c.req.json());
    const u = (await db
      .prepare('SELECT * FROM users WHERE username=?')
      .get(body.username.toLowerCase())) as User | undefined;
    const [salt, stored] = (
      u?.password_hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`
    ).split(':');
    const actual = scryptSync(body.password, salt!, 64);
    if (
      !u?.password_hash ||
      !timingSafeEqual(actual, Buffer.from(stored!, 'hex'))
    )
      fail(401, 'INVALID_CREDENTIALS');
    await setSession(c, u!.id);
    return c.json({ id: u!.id, username: u!.username, role: u!.role });
  });
  app.post('/api/auth/logout', async (c) => {
    const t = getCookie(c, 'tracelab_session');
    if (t)
      await db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(t));
    deleteCookie(c, 'tracelab_session', { path: '/' });
    return c.json({ ok: true });
  });
  app.post('/api/demo', async (c) => {
    const result = await transaction(db, async () => {
      const space = randomUUID(),
        teacher = randomUUID(),
        student = randomUUID(),
        room = randomUUID(),
        assignment = randomUUID();
      for (const [id, role] of [
        [teacher, 'teacher'],
        [student, 'student'],
      ] as const)
        await db
          .prepare('INSERT INTO users VALUES(?,?,?,?,?,?)')
          .run(id, `${role}-${space}`, null, role, space, now());
      await db
        .prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)')
        .run(
          room,
          teacher,
          'Reasoning Studio · Demo',
          randomBytes(6).toString('hex').toUpperCase(),
          now(),
        );
      await db
        .prepare('INSERT INTO classroom_memberships VALUES(?,?)')
        .run(room, student);
      await db
        .prepare('INSERT INTO assignments VALUES(?,?,?,?,?,?,?)')
        .run(
          assignment,
          room,
          'The distribution detective',
          JSON.stringify(demoQuestion),
          'immediate',
          null,
          now(),
        );
      await event(room, null, 'ASSIGNMENT_PUBLISHED', {
        assignmentId: assignment,
      });
      return { student, room, assignment };
    });
    await setSession(c, result.student);
    return c.json({ demo: true, ...result }, 201);
  });
  app.post('/api/demo/role', async (c) => {
    const u = c.get('user');
    if (!u.demo_space) fail(403, 'DEMO_ONLY');
    const { role } = z
      .object({ role: roleSchema })
      .strict()
      .parse(await c.req.json());
    const target = (await db
      .prepare('SELECT id FROM users WHERE demo_space=? AND role=?')
      .get(u.demo_space, role)) as {
      id: string;
    };
    await setSession(c, target.id);
    return c.json({ role });
  });
  app.get('/api/me', async (c) => {
    const u = c.get('user');
    return c.json({
      id: u.id,
      username: u.demo_space
        ? u.role === 'teacher'
          ? 'Alex · fictional teacher'
          : 'Sam · fictional student'
        : u.username,
      role: u.role,
      demo: !!u.demo_space,
    });
  });
  app.get('/api/classrooms', async (c) => {
    const u = c.get('user');
    return c.json(
      await db
        .prepare(
          'SELECT DISTINCT c.id,c.name,CASE WHEN c.owner_id=? THEN c.code ELSE NULL END code FROM classrooms c LEFT JOIN classroom_memberships m ON m.classroom_id=c.id WHERE c.owner_id=? OR m.user_id=?',
        )
        .all(u.id, u.id, u.id),
    );
  });
  app.post('/api/classrooms', async (c) => {
    const u = c.get('user');
    if (u.role !== 'teacher') fail(403, 'TEACHER_REQUIRED');
    const b = classroomSchema.parse(await c.req.json());
    const id = randomUUID(),
      code = randomBytes(6).toString('hex').toUpperCase();
    await db
      .prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)')
      .run(id, u.id, b.name, code, now());
    return c.json({ id, name: b.name, code }, 201);
  });
  app.post('/api/classrooms/enroll', async (c) => {
    const u = c.get('user');
    if (u.role !== 'student') fail(403, 'STUDENT_REQUIRED');
    const b = enrollmentSchema.parse(await c.req.json());
    const room = (await db
      .prepare(
        'SELECT c.id,u.demo_space FROM classrooms c JOIN users u ON u.id=c.owner_id WHERE c.code=?',
      )
      .get(b.code)) as
      | {
          id: string;
          demo_space: string | null;
        }
      | undefined;
    if (!room || room.demo_space !== u.demo_space)
      fail(404, 'CLASSROOM_NOT_FOUND');
    await db
      .prepare(
        'INSERT INTO classroom_memberships VALUES(?,?) ON CONFLICT DO NOTHING',
      )
      .run(room!.id, u.id);
    return c.json({ id: room!.id });
  });
  app.get('/api/questions', async (c) => {
    if (c.get('user').role !== 'teacher') fail(403, 'TEACHER_REQUIRED');
    const b = assignmentSchema
      .pick({ skillId: true, seed: true, difficulty: true })
      .parse({
        skillId: c.req.query('skillId'),
        seed: Number(c.req.query('seed') ?? 0),
        difficulty: c.req.query('difficulty') ?? 'practice',
      });
    if (!skills.some((s) => s.id === b.skillId)) fail(400, 'UNSUPPORTED_SKILL');
    return c.json(generateQuestion(b.skillId, b.seed, b.difficulty));
  });
  app.post('/api/assignments', async (c) => {
    const b = assignmentSchema.parse(await c.req.json());
    await classroom(b.classroomId, c.get('user'), true);
    if (!skills.some((s) => s.id === b.skillId)) fail(400, 'UNSUPPORTED_SKILL');
    const q = generateQuestion(b.skillId, b.seed, b.difficulty),
      id = randomUUID();
    await transaction(db, async () => {
      await db
        .prepare('INSERT INTO assignments VALUES(?,?,?,?,?,?,?)')
        .run(
          id,
          b.classroomId,
          b.title,
          JSON.stringify(q),
          b.feedback,
          b.dueAt,
          now(),
        );
      await event(b.classroomId, null, 'ASSIGNMENT_PUBLISHED', {
        assignmentId: id,
      });
    });
    return c.json({ id }, 201);
  });
  app.get('/api/assignments', async (c) => {
    const u = c.get('user');
    const rows = (await db
      .prepare(
        'SELECT DISTINCT a.* FROM assignments a JOIN classrooms c ON c.id=a.classroom_id LEFT JOIN classroom_memberships m ON m.classroom_id=c.id WHERE c.owner_id=? OR m.user_id=? ORDER BY a.published_at DESC LIMIT 100',
      )
      .all(u.id, u.id)) as unknown as Assignment[];
    return c.json(
      rows.map((a) => {
        const q = JSON.parse(a.question) as Question;
        return {
          ...a,
          question: u.role === 'teacher' ? q : studentQuestion(q),
        };
      }),
    );
  });
  app.post('/api/submissions', async (c) => {
    const u = c.get('user');
    if (u.role !== 'student') fail(403, 'STUDENT_REQUIRED');
    const { assignmentId } = z
      .object({ assignmentId: z.string().uuid() })
      .strict()
      .parse(await c.req.json());
    const a = (await db
      .prepare('SELECT * FROM assignments WHERE id=?')
      .get(assignmentId)) as Assignment | undefined;
    if (!a) fail(404, 'ASSIGNMENT_NOT_FOUND');
    await classroom(a!.classroom_id, u);
    const result = await transaction(db, async () => {
      const old = await db
        .prepare(
          'SELECT id FROM submissions WHERE assignment_id=? AND student_id=?',
        )
        .get(assignmentId, u.id);
      if (old) return old;
      const id = randomUUID();
      await db
        .prepare('INSERT INTO submissions VALUES(?,?,?,?,?,?)')
        .run(id, assignmentId, u.id, 'MANUAL_ENTRY', 1, now());
      await db
        .prepare('INSERT INTO transcription_versions VALUES(?,?,?,?,?)')
        .run(id, 1, '[]', 'manual', now());
      await event(a!.classroom_id, id, 'SUBMISSION_RECEIVED', {
        state: 'MANUAL_ENTRY',
      });
      return { id };
    });
    return c.json(result, 201);
  });
  app.get('/api/submissions/:id', async (c) => {
    const s = await submission(c.req.param('id'), c.get('user'));
    const t = (await db
      .prepare(
        'SELECT * FROM transcription_versions WHERE submission_id=? ORDER BY version DESC LIMIT 1',
      )
      .get(s.id)) as {
      version: number;
      lines: string;
    };
    const visible =
      c.get('user').role === 'teacher' ||
      s.feedback === 'immediate' ||
      s.state === 'FINALIZED';
    const e = visible
      ? ((await db
          .prepare(
            'SELECT result FROM evaluations WHERE submission_id=? ORDER BY created_at DESC LIMIT 1',
          )
          .get(s.id)) as
          | {
              result: string;
            }
          | undefined)
      : undefined;
    const q = JSON.parse(s.question) as Question;
    return c.json({
      id: s.id,
      state: s.state,
      version: t.version,
      lines: JSON.parse(t.lines),
      hasImage: !!(await db
        .prepare(
          'SELECT submission_id FROM submission_images WHERE submission_id=? UNION SELECT submission_id FROM image_references WHERE submission_id=?',
        )
        .get(s.id, s.id)),
      ocrAvailable: !!options.visionProvider,
      ocrJob:
        (await db
          .prepare(
            'SELECT id,status,attempts,error_code,provider_version,raw_output FROM ocr_jobs WHERE submission_id=? ORDER BY created_at DESC,id DESC LIMIT 1',
          )
          .get(s.id)) ?? null,
      evaluation: e ? JSON.parse(e.result) : null,
      feedbackHeld: !visible,
      reviews: visible
        ? await db
            .prepare(
              'SELECT decision,reason,created_at FROM teacher_reviews WHERE submission_id=? ORDER BY rowid',
            )
            .all(s.id)
        : [],
      mastery: await masteryProgress(db, s.classroom_id, s.student_id),
      recommendation: e
        ? recommend(
            q.skillId,
            JSON.parse(e.result) as Evaluation,
            await masteredSkills(db, s.classroom_id, s.student_id),
          )
        : null,
    });
  });
  app.patch('/api/submissions/:id/transcription', async (c) => {
    const b = transcriptionSchema.parse(await c.req.json());
    const s = await submission(c.req.param('id'), c.get('user'), true);
    if (!['MANUAL_ENTRY', 'CONFIRMATION_REQUIRED'].includes(s.state))
      fail(409, 'TRANSCRIPTION_LOCKED');
    await transaction(db, async () => {
      if (s.version !== b.version) fail(409, 'STALE_VERSION');
      await db
        .prepare('INSERT INTO transcription_versions VALUES(?,?,?,?,?)')
        .run(s.id, s.version + 1, JSON.stringify(b.lines), 'student', now());
      await db
        .prepare('UPDATE submissions SET version=version+1 WHERE id=?')
        .run(s.id);
    });
    return c.json({ version: s.version + 1 });
  });
  app.post('/api/submissions/:id/confirm', async (c) => {
    const b = confirmSchema.parse(await c.req.json());
    const s = await submission(c.req.param('id'), c.get('user'), true);
    if (s.version !== b.version) fail(409, 'STALE_VERSION');
    if (['EVALUATED', 'TEACHER_REVIEW', 'FINALIZED'].includes(s.state))
      return c.json({ state: s.state, idempotent: true });
    if (!['MANUAL_ENTRY', 'CONFIRMATION_REQUIRED'].includes(s.state))
      fail(409, 'INVALID_STATE');
    const t = (await db
      .prepare(
        'SELECT lines FROM transcription_versions WHERE submission_id=? AND version=?',
      )
      .get(s.id, b.version)) as {
      lines: string;
    };
    const result = evaluateQuestion(
      JSON.parse(s.question) as Question,
      JSON.parse(t.lines),
    );
    await transaction(db, async () => {
      await move(s, 'CONFIRMED');
      await event(s.classroom_id, s.id, 'TRANSCRIPTION_CONFIRMED', {
        version: b.version,
      });
      await db
        .prepare('INSERT INTO evaluations VALUES(?,?,?,?,?,?)')
        .run(
          randomUUID(),
          s.id,
          b.version,
          result.engineVersion,
          JSON.stringify(result),
          now(),
        );
      await move(s, result.requiresReview ? 'TEACHER_REVIEW' : 'EVALUATED');
      await event(s.classroom_id, s.id, 'EVALUATION_COMPLETED', {
        state: s.state,
      });
    });
    return c.json({ state: s.state });
  });
  app.post('/api/submissions/:id/process', async (c) => {
    const s = await submission(c.req.param('id'), c.get('user'), true);
    const body = z
      .object({
        version: z.number().int().positive(),
        idempotencyKey: z.string().uuid(),
      })
      .strict()
      .parse(await c.req.json());
    try {
      return c.json(
        await enqueueOcr(
          db,
          s.id,
          body.version,
          body.idempotencyKey,
          options.visionProvider,
        ),
        202,
      );
    } catch (error) {
      if (error instanceof OcrJobError) fail(error.status, error.message);
      throw error;
    }
  });
  app.post('/api/submissions/:id/manual-entry', async (c) => {
    const s = await submission(c.req.param('id'), c.get('user'), true);
    const body = z
      .object({ version: z.number().int().positive() })
      .strict()
      .parse(await c.req.json());
    try {
      await manualEntry(db, s.id, body.version);
    } catch (error) {
      if (error instanceof OcrJobError) fail(error.status, error.message);
      throw error;
    }
    return c.json({ state: 'MANUAL_ENTRY' });
  });
  app.post('/api/submissions/:id/image', async (c) => {
    let s = await submission(c.req.param('id'), c.get('user'), true);
    if (s.state !== 'MANUAL_ENTRY') fail(409, 'SUBMISSION_LOCKED');
    const bytes = new Uint8Array(await c.req.arrayBuffer());
    const mime = c.req.header('content-type') ?? '';
    let normalized: Buffer;
    try {
      validateImage(bytes, mime);
      normalized = await sharp(bytes, {
        limitInputPixels: 16000000,
        animated: false,
      })
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      fail(400, 'INVALID_IMAGE');
    }
    s = await submission(s.id, c.get('user'), true);
    if (s.state !== 'MANUAL_ENTRY') fail(409, 'SUBMISSION_LOCKED');
    await saveImage(db, options.imageStore, s.id, normalized!);
    return c.json({
      stored: true,
      ocr: options.visionProvider ? 'available' : 'unavailable',
      manualEntry: true,
    });
  });
  app.get('/api/submissions/:id/image', async (c) => {
    const s = await submission(c.req.param('id'), c.get('user'));
    const im = await readImage(db, options.imageStore, s.id);
    if (!im) fail(404, 'IMAGE_NOT_FOUND');
    return new Response(im!.bytes as BodyInit, {
      headers: {
        'Content-Type': im!.mime,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
  app.get('/api/classrooms/:id/submissions', async (c) => {
    await classroom(c.req.param('id'), c.get('user'), true);
    return c.json(
      await db
        .prepare(
          'SELECT s.id,s.state,s.created_at,a.title,u.username FROM submissions s JOIN assignments a ON a.id=s.assignment_id JOIN users u ON u.id=s.student_id WHERE a.classroom_id=? ORDER BY s.created_at DESC LIMIT 100',
        )
        .all(c.req.param('id')),
    );
  });
  app.post('/api/submissions/:id/reviews', async (c) => {
    const b = reviewSchema.parse(await c.req.json());
    const s = await submission(c.req.param('id'), c.get('user'));
    await classroom(s.classroom_id, c.get('user'), true);
    if (!['EVALUATED', 'TEACHER_REVIEW', 'FINALIZED'].includes(s.state))
      fail(409, 'NOT_EVALUATED');
    await transaction(db, async () => {
      const reviewId = randomUUID(),
        reviewedAt = now();
      await db
        .prepare(
          'INSERT INTO teacher_reviews(id,submission_id,teacher_id,decision,reason,created_at) VALUES(?,?,?,?,?,?)',
        )
        .run(
          reviewId,
          s.id,
          c.get('user').id,
          b.decision,
          b.reason,
          reviewedAt,
        );
      await recordMasteryReview(
        db,
        s,
        (JSON.parse(s.question) as Question).skillId,
        reviewId,
        b.decision,
        reviewedAt,
      );
      if (s.state !== 'FINALIZED') {
        if (s.state === 'EVALUATED') await move(s, 'TEACHER_REVIEW');
        await move(s, 'FINALIZED');
      }
      await event(s.classroom_id, s.id, 'FEEDBACK_RELEASED', {
        state: 'FINALIZED',
        decision: b.decision,
      });
    });
    return c.json({ state: 'FINALIZED' });
  });
  app.get('/api/classrooms/:id/mastery', async (c) => {
    const user = c.get('user'),
      classroomId = c.req.param('id');
    await classroom(classroomId, user);
    const studentId = c.req.query('studentId') ?? user.id;
    if (studentId !== user.id || user.role === 'teacher') {
      await classroom(classroomId, user, true);
      if (
        !(await db
          .prepare(
            'SELECT 1 FROM classroom_memberships WHERE classroom_id=? AND user_id=?',
          )
          .get(classroomId, studentId))
      )
        fail(404, 'STUDENT_NOT_FOUND');
    }
    return c.json({
      studentId,
      classroomId,
      algorithmVersion: MASTERY_VERSION,
      provisional: true,
      parameters: BKT_PARAMETERS,
      minimumEvidence: MIN_EVIDENCE,
      readyThreshold: READY_THRESHOLD,
      skills: await masteryProgress(db, classroomId, studentId),
    });
  });
  app.get('/api/classrooms/:id/events', async (c) => {
    await classroom(c.req.param('id'), c.get('user'), true);
    const after = z.coerce
      .number()
      .int()
      .min(0)
      .parse(c.req.query('after') ?? 0);
    return c.json(
      (
        await db
          .prepare(
            'SELECT sequence,id,submission_id,type,payload,created_at FROM domain_events WHERE classroom_id=? AND sequence>? ORDER BY sequence LIMIT 100',
          )
          .all(c.req.param('id'), after)
      ).map((e) => ({ ...e, payload: JSON.parse(e.payload as string) })),
    );
  });
  app.get('/api/classrooms/:id/analytics', async (c) => {
    await classroom(c.req.param('id'), c.get('user'), true);
    return c.json({
      states: await db
        .prepare(
          'SELECT s.state,CAST(COUNT(*) AS INTEGER) count FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE a.classroom_id=? GROUP BY s.state',
        )
        .all(c.req.param('id')),
      finalizedDecisions: await db
        .prepare(
          "SELECT r.decision,CAST(COUNT(*) AS INTEGER) count FROM teacher_reviews r JOIN submissions s ON s.id=r.submission_id JOIN assignments a ON a.id=s.assignment_id WHERE a.classroom_id=? AND s.state='FINALIZED' AND r.rowid=(SELECT MAX(r2.rowid) FROM teacher_reviews r2 WHERE r2.submission_id=s.id) GROUP BY r.decision",
        )
        .all(c.req.param('id')),
    });
  });
  return app;
}
