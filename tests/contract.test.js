import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { run } from '../src/engine.js';
const fixture = () =>
  JSON.parse(readFileSync(new URL('../examples/nominal.json', import.meta.url)));
test('public contract rejects unknown top-level fields', async () => {
  await assert.rejects(async () => run({ ...fixture(), privateNote: 'synthetic' }), {
    code: 'UNKNOWN_FIELD',
  });
});
test('public contract rejects unsupported schema versions', async () => {
  await assert.rejects(async () => run({ ...fixture(), schemaVersion: 2 }), { code: 'VERSION' });
});
test('public contract requires explicit data provenance', async () => {
  const x = fixture();
  delete x.source;
  await assert.rejects(async () => run(x), { code: 'CHOICE' });
});
test('public contract rejects non-object roots', async () => {
  for (const value of [null, [], true, 42])
    await assert.rejects(async () => run(value), { code: 'OBJECT' });
});
test('analysis does not mutate the supplied scenario', async () => {
  const x = fixture(),
    original = structuredClone(x);
  await run(x);
  assert.deepEqual(x, original);
});
test('same scenario produces byte-identical JSON reports', async () => {
  assert.equal(JSON.stringify(await run(fixture())), JSON.stringify(await run(fixture())));
});
test('result numbers remain finite and survive a JSON round trip', async () => {
  const result = await run(fixture());
  function visit(value) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  visit(result);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});
test('command-line analysis uses the same domain engine', async () => {
  const execution = spawnSync(process.execPath, ['scripts/analyze.mjs', 'examples/nominal.json'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8',
  });
  assert.equal(execution.status, 0, execution.stderr);
  assert.deepEqual(JSON.parse(execution.stdout), await run(fixture()));
});
test('command-line invocation without an input returns a useful failure', () => {
  const execution = spawnSync(process.execPath, ['scripts/analyze.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8',
  });
  assert.equal(execution.status, 1);
  assert.equal(JSON.parse(execution.stderr).error, 'INPUT');
});

import config from '../src/config.js';
test('nominal control value satisfies native number-input bounds and step', () => {
  const value = fixture()[config.setting.key],
    setting = config.setting;
  assert.ok(value >= setting.min && value <= setting.max);
  const steps = (value - setting.min) / setting.step;
  assert.ok(Math.abs(steps - Math.round(steps)) < 1e-8);
});
