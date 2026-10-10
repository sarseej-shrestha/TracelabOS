import { expect, it } from 'vitest';
import { openDatabase } from '../../packages/database/src/local.ts';
import { createApp } from '../../services/api/src/app.ts';
import { importLocal } from '../../packages/database/src/import-local.ts';
import { testPostgres } from '../helpers/postgres.ts';
it('imports immutable local work and event ordering, and refuses to overwrite a populated target', async () => {
  const local = openDatabase(':memory:');
  const { db } = await testPostgres();
  try {
    const app = createApp(local);
    let cookie = '';
    const call = async (path: string, body: unknown, method = 'POST') => {
      const response = await app.request(`http://localhost/api${path}`, {
        method,
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify(body),
      });
      expect(response.ok).toBe(true);
      if (response.headers.has('set-cookie'))
        cookie = response.headers.get('set-cookie')!.split(';')[0]!;
      return response.json();
    };
    const demo = await call('/demo', {});
    const s = await call('/submissions', { assignmentId: demo.assignment });
    await call(
      `/submissions/${s.id}/transcription`,
      { version: 1, lines: ['x=7'] },
      'PATCH',
    );
    await call(`/submissions/${s.id}/confirm`, { version: 2, confirmed: true });
    await call('/demo/role', { role: 'teacher' });
    await call(`/submissions/${s.id}/reviews`, {
      decision: 'correct',
      reason: 'Checked against the original question.',
    });
    local
      .prepare('INSERT INTO submission_images VALUES(?,?,?)')
      .run(s.id, 'image/jpeg', new Uint8Array([1, 2, 3]));
    local
      .prepare('INSERT INTO image_references VALUES(?,?,?,?,?,?)')
      .run(
        s.id,
        'tracelab-images/v1/imported.jpg',
        'image/jpeg',
        3,
        'abc123',
        new Date().toISOString(),
      );
    local
      .prepare(
        'INSERT INTO ocr_jobs(id,submission_id,request_key,input_version,image_sha256,provider_version,status,raw_output,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      )
      .run(
        'imported-job',
        s.id,
        'imported-request',
        1,
        'hash',
        'historical-model',
        'SUCCEEDED',
        '{"preserved":true}',
        new Date().toISOString(),
        new Date().toISOString(),
      );
    const counts = await importLocal(local, db);
    expect(await db.prepare('SELECT * FROM ocr_jobs').get()).toEqual(
      local.prepare('SELECT * FROM ocr_jobs').get(),
    );
    expect(await db.prepare('SELECT * FROM image_references').get()).toEqual(
      local.prepare('SELECT * FROM image_references').get(),
    );
    for (const table of ['mastery_evidence', 'mastery_estimates']) {
      expect(await db.prepare(`SELECT * FROM ${table}`).all()).toEqual(
        local.prepare(`SELECT * FROM ${table}`).all(),
      );
      expect(counts[table]).toBe(1);
    }
    expect(counts).toMatchObject({
      users: 2,
      classrooms: 1,
      assignments: 1,
      submissions: 1,
      transcription_versions: 2,
      evaluations: 1,
      teacher_reviews: 1,
      submission_images: 1,
      ocr_jobs: 1,
      image_references: 1,
    });
    expect(await db.prepare('SELECT result FROM evaluations').get()).toEqual(
      local.prepare('SELECT result FROM evaluations').get(),
    );
    expect(
      await db
        .prepare(
          'SELECT sequence,type,payload FROM domain_events ORDER BY sequence',
        )
        .all(),
    ).toEqual(
      local
        .prepare(
          'SELECT sequence,type,payload FROM domain_events ORDER BY sequence',
        )
        .all(),
    );
    expect(
      Array.from(
        (await db.prepare('SELECT bytes FROM submission_images').get())!
          .bytes as Uint8Array,
      ),
    ).toEqual([1, 2, 3]);
    await expect(importLocal(local, db)).rejects.toThrow('empty target');
    await db
      .prepare(
        'INSERT INTO domain_events(id,classroom_id,type,payload,created_at) VALUES(?,?,?,?,?)',
      )
      .run(
        'after-import',
        demo.room,
        'IMPORT_VERIFIED',
        '{}',
        new Date().toISOString(),
      );
    expect(
      (
        await db
          .prepare('SELECT sequence FROM domain_events WHERE id=?')
          .get('after-import')
      )?.sequence,
    ).toBe(counts.domain_events! + 1);
    expect(local.prepare('SELECT COUNT(*) n FROM domain_events').get()?.n).toBe(
      counts.domain_events,
    );
  } finally {
    local.close();
    await db.close();
  }
});

it('imports a pre-mastery database without inventing reviewed evidence', async () => {
  const local = openDatabase(':memory:');
  const { db } = await testPostgres();
  try {
    local.exec(
      'DROP TABLE mastery_estimates; DROP TABLE mastery_evidence; DROP TABLE skill_prerequisites; DROP TABLE skills; DELETE FROM schema_migrations WHERE version=4',
    );
    const counts = await importLocal(local, db);
    expect(counts.mastery_evidence).toBe(0);
    expect(counts.mastery_estimates).toBe(0);
    expect((await db.prepare('SELECT COUNT(*) n FROM skills').get())?.n).toBe(
      24,
    );
  } finally {
    local.close();
    await db.close();
  }
});
