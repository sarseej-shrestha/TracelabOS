'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { QuestionDiagram } from '../../../packages/ui/src/question-diagram';
import type { OcrResult } from '../../../packages/contracts/src/index';
import type { Evaluation } from '../../../packages/math-engine/src/index';
import type { Question } from '../../../packages/question-bank/src/index';
type Me = {
  id: string;
  username: string;
  role: 'teacher' | 'student';
  demo: boolean;
};
type Room = { id: string; name: string; code: string | null };
type Assignment = {
  id: string;
  title: string;
  question: Question;
  classroom_id: string;
};
type Submission = {
  id: string;
  state: string;
  version: number;
  lines: string[];
  hasImage: boolean;
  ocrAvailable: boolean;
  ocrJob: {
    id: string;
    status: string;
    attempts: number;
    error_code: string | null;
    provider_version: string;
    raw_output: string | null;
  } | null;
  evaluation: Evaluation | null;
  feedbackHeld: boolean;
  reviews: { decision: string; reason: string }[];
  recommendation: { skillId: string; reason: string } | null;
};
type Event = {
  sequence: number;
  type: string;
  created_at: string;
  submission_id: string | null;
};
type Skill = {
  id: string;
  title: string;
  unit: string;
  description: string;
  examples: string[][];
  prerequisites: string[];
  standards?: string[];
  misconceptions?: string[];
};
async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const r = await fetch(`/api${path}`, {
    method,
    signal,
    headers:
      body instanceof Blob
        ? { 'Content-Type': body.type }
        : { 'Content-Type': 'application/json' },
    ...(body !== undefined
      ? { body: body instanceof Blob ? body : JSON.stringify(body) }
      : {}),
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(
      data.error?.replaceAll('_', ' ').toLowerCase() ?? 'Request failed',
    );
  return data;
}
function Arrow() {
  return <span aria-hidden="true">↗</span>;
}
export default function Home() {
  const [me, setMe] = useState<Me | null>(null),
    [page, setPage] = useState('workspace'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]),
    [assignments, setAssignments] = useState<Assignment[]>([]),
    [skills, setSkills] = useState<Skill[]>([]),
    [selected, setSelected] = useState<Assignment | null>(null),
    [sub, setSub] = useState<Submission | null>(null),
    [lines, setLines] = useState<string[]>(['']),
    [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState(''),
    [photo, setPhoto] = useState<Blob | null>(null),
    [crop, setCrop] = useState(0),
    [auth, setAuth] = useState(false),
    [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [queue, setQueue] = useState<
      { id: string; title: string; state: string; username: string }[]
    >([]),
    [events, setEvents] = useState<Event[]>([]),
    [cursor, setCursor] = useState(0),
    [roomId, setRoomId] = useState(''),
    [questionPreview, setQuestionPreview] = useState<Question | null>(null);
  const [analytics, setAnalytics] = useState<{
    states: { state: string; count: number }[];
    finalizedDecisions: { decision: string; count: number }[];
  }>({ states: [], finalizedDecisions: [] });
  const [decision, setDecision] = useState('needs_practice'),
    [reason, setReason] = useState('');
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    const [u, r, a] = await Promise.all([
      api<Me>('/me'),
      api<Room[]>('/classrooms'),
      api<Assignment[]>('/assignments'),
    ]);
    setMe(u);
    setRooms(r);
    setAssignments(a);
    if (r[0]) setRoomId((id) => (r.some((x) => x.id === id) ? id : r[0]!.id));
  }
  useEffect(() => {
    void api<Skill[]>('/skills')
      .then(setSkills)
      .catch(() => {});
    void refresh().catch(() => {});
  }, []);
  useEffect(
    () => () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function startDemo() {
    await api('/demo', 'POST');
    await refresh();
    setAuth(false);
    setPage('workspace');
    setSub(null);
    setSelected(null);
  }
  async function openAssignment(a: Assignment) {
    const s = await api<{ id: string }>('/submissions', 'POST', {
      assignmentId: a.id,
    });
    const full = await api<Submission>(`/submissions/${s.id}`);
    setSelected(a);
    setSub(full);
    setLines(full.lines.length ? full.lines : ['']);
    setConsent(false);
    setPhoto(null);
    setPreview(full.hasImage ? `/api/submissions/${full.id}/image` : '');
  }
  async function inspect(id: string) {
    const full = await api<Submission>(`/submissions/${id}`);
    setSub(full);
    setLines(full.lines.length ? full.lines : ['']);
    setPreview(full.hasImage ? `/api/submissions/${full.id}/image` : '');
  }
  useEffect(() => {
    if (!sub || sub.state !== 'PROCESSING' || me?.role !== 'student') return;
    const id = sub.id,
      controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const full = await api<Submission>(
          `/submissions/${id}`,
          'GET',
          undefined,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setSub(full);
        if (full.state !== 'PROCESSING') {
          setLines(full.lines.length ? full.lines : ['']);
          setConsent(false);
          setNotice(
            full.state === 'CONFIRMATION_REQUIRED'
              ? 'Extraction ready. Check every symbol against your photograph before confirming.'
              : 'Extraction could not finish. Your saved work is safe; enter the steps manually or retry.',
          );
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
        setNotice('Connection interrupted. Retrying the processing status…');
      }
      timer = setTimeout(poll, 2500);
    }
    timer = setTimeout(poll, 750);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [sub?.id, sub?.state, me?.role]);
  async function startExtraction() {
    if (!sub) return;
    let version = sub.version;
    const draft = lines.filter((line) => line.trim().length > 0);
    if (sub.state === 'MANUAL_ENTRY' && draft.length) {
      const saved = await api<{ version: number }>(
        `/submissions/${sub.id}/transcription`,
        'PATCH',
        { version, lines: draft },
      );
      version = saved.version;
      setSub({ ...sub, version, lines: draft });
    }
    await api(`/submissions/${sub.id}/process`, 'POST', {
      version,
      idempotencyKey: crypto.randomUUID(),
    });
    setConsent(false);
    await inspect(sub.id);
  }
  async function useManualEntry() {
    if (!sub) return;
    await api(`/submissions/${sub.id}/manual-entry`, 'POST', {
      version: sub.version,
    });
    setConsent(false);
    await inspect(sub.id);
    setNotice('Manual entry is ready. Your saved transcription is preserved.');
  }
  async function loadTeacher(id = roomId) {
    if (!id) return;
    const [q, e, a] = await Promise.all([
      api<typeof queue>(`/classrooms/${id}/submissions`),
      api<Event[]>(`/classrooms/${id}/events`),
      api<typeof analytics>(`/classrooms/${id}/analytics`),
    ]);
    setQueue(q);
    setEvents(e);
    setCursor(e.length);
    setAnalytics(a);
  }
  useEffect(() => {
    if (me?.role === 'teacher' && roomId) void act(() => loadTeacher(roomId));
  }, [me?.role, roomId]); // Dashboard refresh is explicit after mutations.
  async function switchRole() {
    await api('/demo/role', 'POST', {
      role: me?.role === 'teacher' ? 'student' : 'teacher',
    });
    setSub(null);
    setSelected(null);
    setPreview('');
    await refresh();
  }
  function updateLines(next: string[]) {
    setLines(next);
    setConsent(false);
  }
  async function save() {
    if (!sub) return;
    const result = await api<{ version: number }>(
      `/submissions/${sub.id}/transcription`,
      'PATCH',
      { version: sub.version, lines },
    );
    setSub({ ...sub, version: result.version, lines });
    setNotice('Transcription saved.');
  }
  async function confirm() {
    if (!sub || !consent) return;
    const result = await api<{ version: number }>(
      `/submissions/${sub.id}/transcription`,
      'PATCH',
      { version: sub.version, lines },
    );
    setSub({ ...sub, version: result.version });
    await api(`/submissions/${sub.id}/confirm`, 'POST', {
      version: result.version,
      confirmed: true,
    });
    await inspect(sub.id);
    setNotice('Your confirmed steps have been checked.');
  }
  async function adjust(rotate: boolean) {
    if (!photo) return;
    const bitmap = await createImageBitmap(photo);
    const canvas = document.createElement('canvas');
    const inset = rotate ? 0 : crop / 100;
    const w = Math.round(bitmap.width * (1 - 2 * inset)),
      h = Math.round(bitmap.height * (1 - 2 * inset));
    canvas.width = rotate ? h : w;
    canvas.height = rotate ? w : h;
    const ctx = canvas.getContext('2d')!;
    if (rotate) {
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
    }
    ctx.drawImage(
      bitmap,
      bitmap.width * inset,
      bitmap.height * inset,
      w,
      h,
      0,
      0,
      w,
      h,
    );
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image adjustment failed'))),
        'image/jpeg',
        0.85,
      ),
    );
    setPhoto(blob);
    setPreview(URL.createObjectURL(blob));
    setCrop(0);
  }
  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await act(async () => {
      await api(`/auth/${authMode}`, 'POST', {
        username: f.get('username'),
        password: f.get('password'),
        ...(authMode === 'register' ? { role: f.get('role') } : {}),
      });
      await refresh();
      setAuth(false);
    });
  }
  const locked =
    !!sub && !['MANUAL_ENTRY', 'CONFIRMATION_REQUIRED'].includes(sub.state);
  const graded =
    !!sub && ['EVALUATED', 'TEACHER_REVIEW', 'FINALIZED'].includes(sub.state);
  const teacher = me?.role === 'teacher';
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a href="/" className="brand">
          <span className="brand-mark">
            t<span>:</span>
          </span>
          TraceLab <b>OS</b>
        </a>
        <span className="top-tag">THE REASONING WORKSPACE</span>
        <div className="top-actions">
          <a
            href="https://github.com/sarseej-shrestha/TracelabOS"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <Arrow />
          </a>
          {me ? (
            <>
              <span className="persona">{me.username}</span>
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  void act(async () => {
                    await api('/auth/logout', 'POST');
                    setMe(null);
                    setSub(null);
                    setSelected(null);
                  })
                }
              >
                Sign out
              </button>
            </>
          ) : (
            <button className="text-button" onClick={() => setAuth(!auth)}>
              Sign in
            </button>
          )}
        </div>
      </header>
      {!me ? (
        <main id="main" className="landing">
          <div className="eyebrow">
            <span className="dot" /> UNDERSTAND THE WORK BETWEEN THE ANSWERS
          </div>
          <div className="hero-grid">
            <section>
              <h1>
                A wrong answer.
                <br />
                <em>A useful beginning.</em>
              </h1>
              <p className="hero-copy">
                The most important part of a math problem is how a student gets
                there. Follow their steps, find the first misunderstanding, and
                make the next step count.
              </p>
              <div className="hero-buttons">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void act(startDemo)}
                >
                  Debug a student’s thinking <Arrow />
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setAuth(true);
                    setAuthMode('register');
                  }}
                >
                  Create a local account
                </button>
              </div>
              <p className="fine">
                No registration needed for the demo. Fictional classroom, real
                mathematics.
              </p>
            </section>
            <section
              className="hero-paper"
              aria-label="Example reasoning analysis"
            >
              <div className="paper-heading">
                <span>CASE STUDY 001</span>
                <span>LINEAR EQUATIONS</span>
              </div>
              <div className="paper-math">3(x − 2) = 15</div>
              <div className="paper-math mistake">
                3x − 2 = 15 <span>01</span>
              </div>
              <div className="paper-math muted">3x = 17</div>
              <div className="paper-math muted">x = 17/3</div>
              <div className="paper-note">
                <span className="dot amber" />
                <div>
                  <strong>Start here. Not at the final answer.</strong>
                  <p>
                    The 3 needs to multiply both terms.
                    <br />
                    The later steps carry this error forward.
                  </p>
                </div>
              </div>
              <div className="paper-footer">
                EXPLAINABLE · EXACT ARITHMETIC · STUDENT-CONFIRMED
              </div>
            </section>
          </div>
          {auth && (
            <section className="auth-panel card">
              <h2>
                {authMode === 'login'
                  ? 'Welcome back'
                  : 'Create a local demo account'}
              </h2>
              <p>
                Use a fictional username. This development build is not for real
                student records.
              </p>
              <form onSubmit={signIn}>
                <label>
                  Username
                  <input
                    name="username"
                    required
                    pattern="[a-zA-Z0-9_-]{3,40}"
                    autoComplete="username"
                  />
                </label>
                <label>
                  Password · at least 12 characters
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    maxLength={128}
                    required
                    autoComplete={
                      authMode === 'login' ? 'current-password' : 'new-password'
                    }
                  />
                </label>
                {authMode === 'register' && (
                  <label>
                    Role
                    <select name="role">
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </label>
                )}
                <button className="primary" disabled={busy}>
                  {authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setAuthMode(authMode === 'login' ? 'register' : 'login')
                  }
                >
                  {authMode === 'login'
                    ? 'Need an account?'
                    : 'Already have an account?'}
                </button>
              </form>
            </section>
          )}
          <div className="feature-strip">
            <div>
              <span>01 / CAPTURE</span>
              <h3>Keep the original work.</h3>
              <p>
                Attach a photograph and enter its steps. Live handwriting
                recognition is pending validation.
              </p>
            </div>
            <div>
              <span>02 / TRACE</span>
              <h3>Find the first divergence.</h3>
              <p>
                Exact arithmetic separates an initial error from the reasoning
                that follows it.
              </p>
            </div>
            <div>
              <span>03 / TEACH</span>
              <h3>Turn evidence into action.</h3>
              <p>
                Inspect each step, record your judgment, and choose a focused
                next practice.
              </p>
            </div>
          </div>
        </main>
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-label">YOUR WORKSPACE</div>
            <nav aria-label="Workspace">
              <button
                className={page === 'workspace' ? 'active' : ''}
                onClick={() => setPage('workspace')}
              >
                <span>◈</span>
                {teacher ? 'Classroom studio' : 'My assignments'}
              </button>
              <button
                className={page === 'curriculum' ? 'active' : ''}
                onClick={() => setPage('curriculum')}
              >
                <span>▤</span>Skill library
              </button>
              <button
                className={page === 'engineering' ? 'active' : ''}
                onClick={() => setPage('engineering')}
              >
                <span>⌘</span>Engineering
              </button>
            </nav>
            <div className="sidebar-bottom">
              <span className="badge">
                {me.demo ? 'FICTIONAL DEMO' : 'LOCAL DEVELOPMENT'}
              </span>
              <p>
                A little more insight.
                <br />A better next step.
              </p>
              {me.demo && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void act(switchRole)}
                >
                  Switch to {teacher ? 'student' : 'teacher'} <Arrow />
                </button>
              )}
            </div>
          </aside>
          <main id="main" className="workspace">
            <div className="breadcrumb">
              TraceLab OS <span>/</span> {teacher ? 'Teacher' : 'Student'}{' '}
              workspace
            </div>
            {page === 'engineering' ? (
              <>
                <div className="page-heading">
                  <div className="eyebrow">BUILT TO BE INSPECTED</div>
                  <h1>Evidence over promises.</h1>
                  <p>
                    The current build checks rational arithmetic and
                    single-variable linear equations.
                  </p>
                </div>
                <div className="info-grid">
                  <section className="card">
                    <h2>Deterministic by design</h2>
                    <p>
                      Tokenize → typed AST → exact rational normalization →
                      compare consecutive steps → trace the first error.
                    </p>
                    <p>
                      Variable denominators, nonlinear expressions, and
                      ambiguous identities require review. Matching solutions
                      does not prove an unshown operation.
                    </p>
                  </section>
                  <section className="card">
                    <h2>What runs here</h2>
                    <p>
                      Next.js, a Hono API, local SQLite, immutable transcription
                      versions, versioned evaluations, and append-only teacher
                      decisions.
                    </p>
                    <p>
                      Hosted OCR, Neon/R2 deployment, WebSockets, and
                      statistical mastery are pending. No cloud latency or OCR
                      accuracy is claimed.
                    </p>
                  </section>
                  <section className="card">
                    <h2>Reproduce the evidence</h2>
                    <code>npm run verify</code>
                    <p>
                      Unit, generated-case, API authorization, and workflow
                      tests live alongside the implementation. See the vault for
                      the latest actual run.
                    </p>
                    <a href="https://github.com/sarseej-shrestha/TracelabOS">
                      Official repository <Arrow />
                    </a>
                  </section>
                </div>
              </>
            ) : page === 'curriculum' ? (
              <>
                <div className="page-heading">
                  <div className="eyebrow">SMALL STEPS, STRONG FOUNDATIONS</div>
                  <h1>The skill library.</h1>
                  <p>
                    {skills.length} implemented skills. Ratios, geometry, and
                    broader coverage are still on the roadmap.
                  </p>
                </div>
                <div className="info-grid">
                  {skills.map((s) => (
                    <section className="card" key={s.id}>
                      <span className="eyebrow">{s.unit}</span>
                      <h2>{s.title}</h2>
                      <p>{s.description}</p>
                      {s.examples.map((ex, i) => (
                        <div className="worked-example" key={i}>
                          <strong>Example {i + 1}</strong>
                          {ex.map((line, j) => (
                            <div className="equation small" key={j}>
                              {line}
                            </div>
                          ))}
                        </div>
                      ))}
                      {s.misconceptions && (
                        <details>
                          <summary>Common mistakes to look for</summary>
                          <ul>
                            {s.misconceptions.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {s.standards && (
                        <p className="fine">
                          Alignment reference:{' '}
                          <a
                            href="https://www.thecorestandards.org/wp-content/uploads/Math_Standards.pdf"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {s.standards.join(', ')}
                          </a>
                        </p>
                      )}
                      <p className="fine">
                        Prerequisites:{' '}
                        {s.prerequisites.join(', ') || 'None in this library'}
                      </p>
                    </section>
                  ))}
                </div>
              </>
            ) : teacher ? (
              <>
                <div className="page-heading">
                  <div className="eyebrow">EVERY STEP TELLS YOU SOMETHING</div>
                  <h1>Classroom studio.</h1>
                  <p>See the thinking. Guide the next attempt.</p>
                </div>
                <div className="teacher-controls">
                  <label>
                    Classroom
                    <select
                      value={roomId}
                      onChange={(e) => {
                        setRoomId(e.target.value);
                        setSub(null);
                      }}
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {rooms.find((r) => r.id === roomId)?.code && (
                    <div>
                      <span className="eyebrow">ENROLLMENT CODE</span>
                      <code className="enrollment">
                        {rooms.find((r) => r.id === roomId)?.code}
                      </code>
                    </div>
                  )}
                  <button
                    className="secondary"
                    disabled={busy || !roomId}
                    onClick={() => void act(() => loadTeacher())}
                  >
                    Refresh progress
                  </button>
                </div>
                <div className="stats">
                  <div>
                    <strong>{queue.length}</strong>
                    <span>Submissions in this view</span>
                  </div>
                  <div>
                    <strong>
                      {analytics.states.find((s) => s.state === 'FINALIZED')
                        ?.count ?? 0}
                    </strong>
                    <span>Finalized reviews</span>
                  </div>
                  <div>
                    <strong>{events.length}</strong>
                    <span>Recorded events in this view</span>
                  </div>
                </div>
                <details className="card">
                  <summary>Create a classroom or publish an assignment</summary>
                  <div className="builder-grid">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        void act(async () => {
                          await api('/classrooms', 'POST', {
                            name: f.get('name'),
                          });
                          await refresh();
                          setNotice(
                            'Classroom created. Select it above to publish.',
                          );
                        });
                      }}
                    >
                      <h2>A new classroom</h2>
                      <label>
                        Classroom name
                        <input
                          name="name"
                          minLength={2}
                          maxLength={80}
                          required
                        />
                      </label>
                      <button className="secondary" disabled={busy}>
                        Create classroom
                      </button>
                    </form>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        void act(async () => {
                          await api('/assignments', 'POST', {
                            classroomId: roomId,
                            title: f.get('title'),
                            skillId: f.get('skill'),
                            seed: Number(f.get('seed')),
                            difficulty: f.get('difficulty'),
                            feedback: f.get('feedback'),
                            dueAt: f.get('due')
                              ? new Date(String(f.get('due'))).toISOString()
                              : null,
                          });
                          await refresh();
                          await loadTeacher();
                          setNotice('Assignment published.');
                        });
                      }}
                    >
                      <h2>Publish an assignment</h2>
                      <label>
                        Title
                        <input
                          name="title"
                          required
                          minLength={2}
                          maxLength={120}
                        />
                      </label>
                      <label>
                        Skill
                        <select name="skill">
                          {skills.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="form-row">
                        <label>
                          Variation seed
                          <input
                            type="number"
                            name="seed"
                            min={0}
                            max={2147483647}
                            defaultValue={42}
                            required
                          />
                        </label>
                        <label>
                          Difficulty
                          <select name="difficulty">
                            <option>intro</option>
                            <option>practice</option>
                            <option>challenge</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        Feedback release
                        <select name="feedback">
                          <option value="teacher">After teacher review</option>
                          <option value="immediate">Immediately</option>
                        </select>
                      </label>
                      <label>
                        Due date (optional)
                        <input type="datetime-local" name="due" />
                      </label>
                      <div className="button-row">
                        <button
                          type="button"
                          className="secondary"
                          onClick={(e) => {
                            const f = new FormData(e.currentTarget.form!);
                            void act(async () =>
                              setQuestionPreview(
                                await api<Question>(
                                  `/questions?skillId=${f.get('skill')}&seed=${f.get('seed')}&difficulty=${f.get('difficulty')}`,
                                ),
                              ),
                            );
                          }}
                        >
                          Preview
                        </button>
                        <button className="primary" disabled={busy || !roomId}>
                          Publish assignment
                        </button>
                      </div>
                      {questionPreview && (
                        <div>
                          <p className="equation small">
                            {questionPreview.expression}
                          </p>
                          {questionPreview.figure && (
                            <QuestionDiagram figure={questionPreview.figure} />
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                </details>
                <section className="card queue">
                  <div className="section-title">
                    <h2>The submission desk</h2>
                    <span className="badge">{queue.length} SUBMISSIONS</span>
                  </div>
                  {queue.length === 0 ? (
                    <p>
                      No work yet. Switch to the student view and submit the
                      first solution.
                    </p>
                  ) : (
                    queue.map((q) => (
                      <button
                        className="queue-row"
                        key={q.id}
                        onClick={() => void act(() => inspect(q.id))}
                      >
                        <span>
                          <strong>{q.title}</strong>
                          <small>
                            {me.demo ? 'Sam · fictional student' : q.username}
                          </small>
                        </span>
                        <span className="badge">
                          {q.state.replaceAll('_', ' ')}
                        </span>
                        <Arrow />
                      </button>
                    ))
                  )}
                </section>
                {sub && (
                  <section className="card">
                    <div className="section-title">
                      <h2>Submission inspection</h2>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSub(null);
                          setPreview('');
                        }}
                      >
                        Close
                      </button>
                    </div>
                    {preview && (
                      <img
                        className="inspection-photo"
                        src={preview}
                        alt="Student's submitted mathematics"
                      />
                    )}
                    <OriginalOcr sub={sub} />
                    <Reasoning sub={sub} />
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void act(async () => {
                          await api(`/submissions/${sub.id}/reviews`, 'POST', {
                            decision,
                            reason,
                          });
                          await inspect(sub.id);
                          await loadTeacher();
                          setNotice(
                            'Review recorded and feedback released. The automatic evaluation is preserved.',
                          );
                        });
                      }}
                    >
                      <label>
                        Teacher decision
                        <select
                          value={decision}
                          onChange={(e) => setDecision(e.target.value)}
                        >
                          <option value="needs_practice">
                            Needs targeted practice
                          </option>
                          <option value="correct">Accept as correct</option>
                          <option value="requires_review">
                            Needs further review
                          </option>
                        </select>
                      </label>
                      <label>
                        Review explanation
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          minLength={5}
                          maxLength={1000}
                          required
                        />
                      </label>
                      <button
                        className="primary"
                        disabled={busy || !sub.evaluation}
                      >
                        Record review & release feedback
                      </button>
                    </form>
                  </section>
                )}
                <section className="card">
                  <div className="section-title">
                    <h2>Classroom time machine</h2>
                    <span className="eyebrow">PERSISTED EVENT HISTORY</span>
                  </div>
                  <p>
                    Inspect the ordered events recorded for this classroom. This
                    view shows up to the first 100 events.
                  </p>
                  <label>
                    Replay position · {cursor} of {events.length}
                    <input
                      type="range"
                      min={0}
                      max={events.length}
                      value={cursor}
                      onChange={(e) => setCursor(Number(e.target.value))}
                    />
                  </label>
                  <ol className="events">
                    {events.slice(0, cursor).map((e) => (
                      <li key={e.sequence}>
                        <span>{e.type.replaceAll('_', ' ').toLowerCase()}</span>
                        <time>
                          {new Date(e.created_at).toLocaleTimeString()}
                        </time>
                      </li>
                    ))}
                  </ol>
                </section>
              </>
            ) : (
              <>
                <div className="page-heading">
                  <div className="eyebrow">YOUR THINKING, MADE VISIBLE</div>
                  <h1>
                    {selected
                      ? 'Let’s follow your reasoning.'
                      : 'A place for your next breakthrough.'}
                  </h1>
                  <p>
                    {selected
                      ? 'Keep the work. Check the transcription. Discover what comes next.'
                      : 'Choose an assignment and show the steps that got you there.'}
                  </p>
                </div>
                {!selected ? (
                  <>
                    <div className="assignment-grid">
                      {assignments.map((a, i) => (
                        <button
                          className="assignment-card"
                          key={a.id}
                          disabled={busy}
                          onClick={() => void act(() => openAssignment(a))}
                        >
                          <div className="section-title">
                            <span className="eyebrow">
                              ASSIGNMENT {String(i + 1).padStart(2, '0')}
                            </span>
                            <Arrow />
                          </div>
                          <h2>{a.title}</h2>
                          <div className="equation">
                            {a.question.expression}
                          </div>
                          <p>{a.question.prompt}</p>
                          <span className="card-link">Open workspace →</span>
                        </button>
                      ))}
                    </div>
                    {assignments.length === 0 && (
                      <p>
                        No assignments yet. Join a classroom using your
                        teacher’s code.
                      </p>
                    )}
                    <details className="card">
                      <summary>Join a classroom</summary>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          void act(async () => {
                            await api('/classrooms/enroll', 'POST', {
                              code: String(f.get('code')).trim().toUpperCase(),
                            });
                            await refresh();
                            setNotice('Classroom joined.');
                          });
                        }}
                      >
                        <label>
                          12-character enrollment code
                          <input
                            name="code"
                            minLength={12}
                            maxLength={12}
                            required
                          />
                        </label>
                        <button className="primary" disabled={busy}>
                          Join classroom
                        </button>
                      </form>
                    </details>
                  </>
                ) : (
                  <>
                    <div className="question-banner">
                      <div>
                        <span className="eyebrow">{selected.title}</span>
                        <p>{selected.question.prompt}</p>
                      </div>
                      <div className="equation">
                        {selected.question.expression}
                      </div>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSelected(null);
                          setSub(null);
                          setPreview('');
                        }}
                      >
                        All assignments
                      </button>
                    </div>
                    {selected.question.figure && (
                      <section className="card">
                        <QuestionDiagram figure={selected.question.figure} />
                      </section>
                    )}
                    <div className="flow">
                      <span className="done">01 Capture or type</span>
                      <span className={graded ? 'done' : 'current'}>
                        02 Confirm transcription
                      </span>
                      <span className={graded ? 'current' : ''}>
                        03 Trace the reasoning
                      </span>
                    </div>
                    <div className="work-grid">
                      <section className="card photo-panel">
                        <div className="section-title">
                          <h2>Your original work</h2>
                          <span className="badge">OPTIONAL PHOTO</span>
                        </div>
                        {preview ? (
                          <img
                            className="work-photo"
                            src={preview}
                            alt="Photograph of your mathematical work"
                          />
                        ) : (
                          <div className="photo-empty">
                            <span aria-hidden="true">⌑</span>
                            <h3>Paper has a place here.</h3>
                            <p>
                              Add a photograph of your solution, or enter your
                              steps alongside.
                            </p>
                          </div>
                        )}
                        {sub?.state === 'MANUAL_ENTRY' && (
                          <>
                            <label className="upload-button">
                              Choose a photo
                              <input
                                type="file"
                                accept="image/jpeg,image/png"
                                capture="environment"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  void act(async () => {
                                    if (f.size > 5 * 1024 * 1024)
                                      throw Error(
                                        'Choose an image smaller than 5 MiB.',
                                      );
                                    const b = await createImageBitmap(f);
                                    if (b.width * b.height > 16000000) {
                                      b.close();
                                      throw Error(
                                        'Choose an image below 16 megapixels.',
                                      );
                                    }
                                    b.close();
                                    setPhoto(f);
                                    setPreview(URL.createObjectURL(f));
                                    setCrop(0);
                                  });
                                }}
                              />
                            </label>
                            {photo && (
                              <>
                                <div className="button-row">
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() => void act(() => adjust(true))}
                                  >
                                    Rotate 90°
                                  </button>
                                  <button
                                    className="primary"
                                    disabled={busy}
                                    onClick={() =>
                                      void act(async () => {
                                        await api(
                                          `/submissions/${sub!.id}/image`,
                                          'POST',
                                          photo,
                                        );
                                        setPhoto(null);
                                        setSub({ ...sub!, hasImage: true });
                                        setNotice(
                                          'Photo saved privately. Extract its steps or enter them yourself.',
                                        );
                                      })
                                    }
                                  >
                                    Save photo
                                  </button>
                                </div>
                                <label>
                                  Crop equally from edges · {crop}%
                                  <input
                                    type="range"
                                    min={0}
                                    max={35}
                                    value={crop}
                                    onChange={(e) =>
                                      setCrop(Number(e.target.value))
                                    }
                                  />
                                </label>
                                <button
                                  className="secondary"
                                  disabled={busy || crop === 0}
                                  onClick={() => void act(() => adjust(false))}
                                >
                                  Apply crop
                                </button>
                              </>
                            )}
                          </>
                        )}
                        <p className="fine">
                          {sub?.ocrAvailable
                            ? 'Experimental recognition can misread handwriting. Compare every line with your photograph; nothing is graded before you confirm.'
                            : 'Automatic extraction is unavailable. Your photograph is private; enter and confirm the steps yourself.'}
                        </p>
                        {sub?.ocrAvailable &&
                          sub.hasImage &&
                          ['MANUAL_ENTRY', 'EXTRACTION_FAILED'].includes(
                            sub.state,
                          ) && (
                            <button
                              className="primary"
                              disabled={busy || !!photo}
                              onClick={() => void act(startExtraction)}
                            >
                              {sub.state === 'EXTRACTION_FAILED'
                                ? 'Retry extraction'
                                : 'Extract handwritten steps'}
                            </button>
                          )}
                        {sub?.state === 'PROCESSING' && (
                          <p role="status">
                            {sub.ocrJob?.status === 'RUNNING'
                              ? 'Reading your handwriting…'
                              : 'Waiting for the handwriting processor…'}{' '}
                            You can switch to manual entry at any time.
                          </p>
                        )}
                        {sub?.state === 'EXTRACTION_FAILED' && (
                          <p role="status">
                            Extraction failed. Enter your steps manually or try
                            again.
                          </p>
                        )}
                        {sub &&
                          [
                            'PROCESSING',
                            'EXTRACTION_FAILED',
                            'CONFIRMATION_REQUIRED',
                          ].includes(sub.state) && (
                            <button
                              className="secondary"
                              disabled={busy}
                              onClick={() => void act(useManualEntry)}
                            >
                              Enter steps manually
                            </button>
                          )}
                        {sub && <OriginalOcr sub={sub} />}
                      </section>
                      <section className="card transcription">
                        <div className="section-title">
                          <h2>
                            {graded
                              ? 'Confirmed steps'
                              : 'What does your work say?'}
                          </h2>
                          <span className="badge">
                            {sub?.state === 'PROCESSING'
                              ? 'PROCESSING'
                              : sub?.state === 'CONFIRMATION_REQUIRED'
                                ? 'CHECK TRANSCRIPTION'
                                : locked
                                  ? 'LOCKED'
                                  : 'MANUAL ENTRY'}
                          </span>
                        </div>
                        <p>
                          {selected.question.answerUnit
                            ? 'Use numerical calculations or metric quantities. Finish with a number and units (cm, mm, m; square units as cm² or cm^2). Formula letters need teacher review.'
                            : 'One expression or equation per line. Use x, parentheses, + − * / and =.'}
                        </p>
                        {!locked &&
                          me.demo &&
                          selected.question.id === 'distribution-demo-v1' && (
                            <div className="example-picker">
                              <span>Try a labeled demo:</span>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  updateLines([
                                    '3(x-2)=15',
                                    '3x-2=15',
                                    '3x=17',
                                    'x=17/3',
                                  ])
                                }
                              >
                                Distribution error
                              </button>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  updateLines([
                                    '3(x-2)=15',
                                    '3x-6=15',
                                    '3x=21',
                                    'x=7',
                                  ])
                                }
                              >
                                Correct solution
                              </button>
                            </div>
                          )}
                        <ol className="line-editor">
                          {lines.map((line, i) => (
                            <li key={i}>
                              <span className="line-number">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <label className="sr-only" htmlFor={`line-${i}`}>
                                Step {i + 1}
                              </label>
                              <input
                                id={`line-${i}`}
                                value={line}
                                readOnly={locked}
                                maxLength={512}
                                autoComplete="off"
                                spellCheck={false}
                                onChange={(e) =>
                                  updateLines(
                                    lines.map((s, j) =>
                                      j === i ? e.target.value : s,
                                    ),
                                  )
                                }
                              />
                              {!locked && (
                                <div className="line-tools">
                                  <button
                                    title="Move step up"
                                    aria-label={`Move step ${i + 1} up`}
                                    disabled={i === 0 || busy}
                                    onClick={() => {
                                      const next = [...lines];
                                      [next[i - 1], next[i]] = [
                                        next[i]!,
                                        next[i - 1]!,
                                      ];
                                      updateLines(next);
                                    }}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    title="Remove step"
                                    aria-label={`Remove step ${i + 1}`}
                                    disabled={lines.length === 1 || busy}
                                    onClick={() =>
                                      updateLines(
                                        lines.filter((_, j) => j !== i),
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                        {!locked && (
                          <>
                            <button
                              className="text-button"
                              disabled={lines.length >= 40 || busy}
                              onClick={() => updateLines([...lines, ''])}
                            >
                              + Add a step
                            </button>
                            <label className="consent">
                              <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                              />
                              <span>
                                I checked these lines. They represent the work I
                                want evaluated.
                              </span>
                            </label>
                            <div className="button-row">
                              <button
                                className="secondary"
                                disabled={busy || lines.some((l) => !l.trim())}
                                onClick={() => void act(save)}
                              >
                                Save draft
                              </button>
                              <button
                                className="primary"
                                disabled={
                                  !consent ||
                                  busy ||
                                  !!photo ||
                                  lines.some((l) => !l.trim())
                                }
                                onClick={() => void act(confirm)}
                              >
                                Confirm & check steps <Arrow />
                              </button>
                            </div>
                            {photo && (
                              <p className="fine">
                                Save the selected photograph before confirming.
                              </p>
                            )}
                          </>
                        )}
                      </section>
                    </div>
                    {sub && graded && (
                      <section className="card reasoning-card">
                        <Reasoning sub={sub} />
                      </section>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      )}
      <div className="status-area" aria-live="polite">
        {busy && <div className="toast">Working…</div>}
        {notice && <div className="toast success">{notice}</div>}
      </div>
      {error && (
        <div className="error-toast" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}
      <footer>
        <span>
          TraceLab OS{' '}
          <span className="muted">/ Debugging the way humans learn.</span>
        </span>
        <span>Private work · Confirm before grading</span>
      </footer>
    </>
  );
}
function Reasoning({ sub }: { sub: Submission }) {
  return (
    <>
      <div className="section-title">
        <h2>The reasoning trace</h2>
        <span className="badge">
          {sub.evaluation?.engineVersion
            ? `ENGINE ${sub.evaluation.engineVersion}`
            : 'AWAITING RELEASE'}
        </span>
      </div>
      {sub.feedbackHeld ? (
        <p>
          Your work has been saved. Your teacher will release feedback after
          reviewing it.
        </p>
      ) : sub.evaluation ? (
        <>
          <div
            className={`insight ${sub.evaluation.firstError ? 'warning' : ''}`}
          >
            <span className="eyebrow">
              {sub.evaluation.requiresReview
                ? 'A HUMAN LOOK IS NEEDED'
                : sub.evaluation.firstError
                  ? `FIRST DIVERGENCE · STEP ${sub.evaluation.firstError}`
                  : sub.evaluation.complete
                    ? 'A COMPLETE, CONSISTENT SOLUTION'
                    : 'VALID SO FAR · KEEP GOING'}
            </span>
            <h3>
              {sub.evaluation.firstError
                ? 'One misunderstanding. A clearer next step.'
                : sub.evaluation.requiresReview
                  ? 'This work needs review before a grade.'
                  : sub.evaluation.complete
                    ? 'Your steps preserve the mathematics.'
                    : 'The solution is not yet finished.'}
            </h3>
          </div>
          {sub.evaluation.domainConditions?.map((condition) => (
            <p key={condition}>Domain condition: {condition}</p>
          ))}
          {sub.evaluation.completionHint && (
            <p role="status">{sub.evaluation.completionHint}</p>
          )}
          <ol className="trace-list">
            {sub.evaluation.steps.map((s) => (
              <li className={s.outcome.toLowerCase()} key={s.line}>
                <span className="trace-dot">{s.line}</span>
                <div>
                  <div className="trace-line">
                    <span className="equation small">{s.input}</span>
                    <span className="badge">
                      {s.outcome.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p>{s.explanation}</p>
                  {s.dependsOn && (
                    <small>Carried forward from step {s.dependsOn}</small>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {sub.recommendation && (
            <div className="recommendation">
              <span className="eyebrow">FOCUSED NEXT PRACTICE</span>
              <h3>{sub.recommendation.skillId.replaceAll('-', ' ')}</h3>
              <p>{sub.recommendation.reason}</p>
            </div>
          )}
        </>
      ) : (
        <p>This submission has not been evaluated.</p>
      )}
      {sub.reviews.length > 0 && (
        <div className="reviews">
          <h3>Teacher review history</h3>
          {sub.reviews.map((r, i) => (
            <div key={i}>
              <strong>{r.decision.replaceAll('_', ' ')}</strong>
              <p>{r.reason}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function OriginalOcr({ sub }: { sub: Submission }) {
  if (!sub.ocrJob?.raw_output) return null;
  const original = JSON.parse(sub.ocrJob.raw_output) as OcrResult;
  return (
    <details className="ocr-original">
      <summary>Original machine transcription</summary>
      <p className="fine">
        Preserved before your corrections. Recognition may contain mistakes.
      </p>
      <ol>
        {original.lines.map((line) => (
          <li key={line.line}>
            <code>{line.raw}</code>
          </li>
        ))}
      </ol>
    </details>
  );
}
