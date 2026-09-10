import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { run, verifyRecords } from '../src/engine.js';
const fixture = () =>
  JSON.parse(readFileSync(new URL('../examples/nominal.json', import.meta.url)));
test('nominal journal retains five events and verifies', async () => {
  const r = await run(fixture());
  assert.equal(r.records.length, 5);
  assert.equal((await verifyRecords(r.records, r.rootHash)).valid, true);
});
test('retention includes events exactly on the cutoff', async () => {
  const x = fixture();
  x.retentionMs = 3000;
  const r = await run(x);
  assert.equal(r.records[0].atMs, 7000);
  assert.equal(r.records.length, 3);
});
test('zero retention exports only events at the review clock', async () => {
  const x = fixture();
  x.retentionMs = 0;
  assert.equal((await run(x)).records.length, 1);
});
test('retention longer than history clamps the cutoff to zero', async () => {
  const x = fixture();
  x.retentionMs = 50000;
  const r = await run(x);
  assert.equal(r.cutoffMs, 0);
  assert.equal(r.records.length, 5);
});
test('input ordering does not change the root', async () => {
  const x = fixture();
  const original = await run(x);
  x.events.reverse();
  assert.equal((await run(x)).rootHash, original.rootHash);
});
test('equal-time events use deterministic event-code ordering', async () => {
  const x = fixture();
  x.events[1].atMs = 0;
  x.events.reverse();
  assert.equal((await run(x)).records[0].id, 'e-0001');
});
test('changed outcome breaks chain verification', async () => {
  const r = await run(fixture());
  r.records[1].outcome = 'skipped';
  assert.equal((await verifyRecords(r.records, r.rootHash)).valid, false);
});
test('removed middle records are detected', async () => {
  const r = await run(fixture());
  r.records.splice(1, 1);
  assert.equal((await verifyRecords(r.records, r.rootHash)).valid, false);
});
test('tail deletion is detected when the expected root is retained', async () => {
  const r = await run(fixture());
  r.records.pop();
  assert.equal((await verifyRecords(r.records, r.rootHash)).valid, false);
});
test('tail deletion alone cannot be proven without an external root', async () => {
  const r = await run(fixture());
  r.records.pop();
  assert.equal((await verifyRecords(r.records)).valid, true);
});
test('unknown fields such as personal notes are rejected', async () => {
  const x = fixture();
  x.events[0].note = 'synthetic note';
  await assert.rejects(run(x), { code: 'UNKNOWN_FIELD' });
});
test('human-readable session names are rejected', async () => {
  const x = fixture();
  x.events[0].sessionId = 'participant-name';
  await assert.rejects(run(x), { code: 'SESSION_ID' });
});
test('future events are rejected', async () => {
  const x = fixture();
  x.nowMs = 9999;
  await assert.rejects(run(x), { code: 'FUTURE_EVENT' });
});
test('duplicate event codes are rejected before retention filtering', async () => {
  const x = fixture();
  x.events[0].id = x.events[1].id;
  x.retentionMs = 0;
  await assert.rejects(run(x), { code: 'DUPLICATE' });
});
test('empty journals have a documented genesis root', async () => {
  const x = fixture();
  x.events = [];
  const r = await run(x);
  assert.equal(r.rootHash, '0'.repeat(64));
  assert.equal((await verifyRecords([], r.rootHash)).valid, true);
});
test('an attacker can recompute an unkeyed chain, so it is not authentication', async () => {
  const x = fixture();
  const original = await run(x);
  x.events[0].outcome = 'unknown';
  const edited = await run(x);
  assert.notEqual(original.rootHash, edited.rootHash);
  assert.equal((await verifyRecords(edited.records)).valid, true);
  assert.equal((await verifyRecords(edited.records, original.rootHash)).valid, false);
});
test('verification rejects unknown fields in otherwise valid records', async () => {
  const r = await run(fixture());
  r.records[0].extra = true;
  assert.equal((await verifyRecords(r.records)).valid, false);
});
test('retention changes the export without mutating the input events', async () => {
  const x = fixture();
  x.retentionMs = 0;
  const before = structuredClone(x);
  await run(x);
  assert.deepEqual(x, before);
});
