import {
  base,
  integer,
  list,
  object,
  choice,
  unique,
  requireThat,
  metric,
  finding,
  report,
} from './validation.js';

export const KINDS = [
  'session-start',
  'session-pause',
  'session-stop',
  'cue-presented',
  'observation',
];
export const OUTCOMES = ['ok', 'skipped', 'interrupted', 'unknown'];
const GENESIS = '0'.repeat(64);

function validateEvent(event) {
  object(event, 'event', ['id', 'atMs', 'sessionId', 'kind', 'outcome']);
  requireThat(
    typeof event.id === 'string' && /^e-[0-9]{4,8}$/.test(event.id),
    'EVENT_ID',
    'Use an event code such as e-0001.',
    'Use um código de evento como e-0001.',
  );
  requireThat(
    typeof event.sessionId === 'string' && /^s-[a-f0-9]{8}$/.test(event.sessionId),
    'SESSION_ID',
    'Use an opaque session code such as s-00000001.',
    'Use um código opaco de sessão como s-00000001.',
  );
  integer(event.atMs, 'atMs', 0, 86400000);
  choice(event.kind, 'kind', KINDS);
  choice(event.outcome, 'outcome', OUTCOMES);
}

export function validate(input) {
  base(input, ['nowMs', 'retentionMs', 'events']);
  integer(input.nowMs, 'nowMs', 0, 86400000);
  integer(input.retentionMs, 'retentionMs', 0, 86400000);
  list(input.events, 'events', 0, 10000);
  input.events.forEach((event) => {
    validateEvent(event);
    requireThat(
      event.atMs <= input.nowMs,
      'FUTURE_EVENT',
      'An event is ahead of the supplied review clock.',
      'Um evento está adiante do relógio de revisão informado.',
    );
  });
  unique(
    input.events.map((e) => e.id),
    'events',
  );
  return input;
}

function canonical(record) {
  return JSON.stringify({
    sequence: record.sequence,
    id: record.id,
    atMs: record.atMs,
    sessionId: record.sessionId,
    kind: record.kind,
    outcome: record.outcome,
    previousHash: record.previousHash,
  });
}

async function digest(value) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** This unkeyed chain detects changes relative to an expected root; it is not authentication. */
export async function verifyRecords(records, expectedRoot = undefined) {
  try {
    list(records, 'records', 0, 10000);
    let previousHash = GENESIS,
      previousTime = -1;
    const ids = [];
    for (const [index, record] of records.entries()) {
      object(record, 'record', [
        'sequence',
        'id',
        'atMs',
        'sessionId',
        'kind',
        'outcome',
        'previousHash',
        'hash',
      ]);
      validateEvent({
        id: record.id,
        atMs: record.atMs,
        sessionId: record.sessionId,
        kind: record.kind,
        outcome: record.outcome,
      });
      requireThat(
        record.sequence === index && record.atMs >= previousTime,
        'ORDER',
        'Record order changed.',
        'A ordem dos registros foi alterada.',
      );
      requireThat(
        record.previousHash === previousHash && record.hash === (await digest(canonical(record))),
        'INTEGRITY',
        'Record chain mismatch.',
        'Inconsistência na cadeia de registros.',
      );
      previousHash = record.hash;
      previousTime = record.atMs;
      ids.push(record.id);
    }
    unique(ids, 'records');
    requireThat(
      expectedRoot === undefined || expectedRoot === previousHash,
      'ROOT',
      'The final hash differs from the expected root.',
      'O hash final difere da referência esperada.',
    );
    return { valid: true, rootHash: previousHash, count: records.length };
  } catch (error) {
    return {
      valid: false,
      code: error.code || 'INTEGRITY',
      message: error.localized || { en: 'Invalid record.', pt: 'Registro inválido.' },
    };
  }
}

export async function run(input) {
  validate(input);
  const cutoffMs = Math.max(0, input.nowMs - input.retentionMs);
  const retained = input.events
    .filter((e) => e.atMs >= cutoffMs)
    .map((e) => ({ ...e }))
    .sort((a, b) => a.atMs - b.atMs || a.id.localeCompare(b.id));
  const records = [],
    findings = [];
  let previousHash = GENESIS;
  for (const [sequence, event] of retained.entries()) {
    const record = { sequence, ...event, previousHash };
    record.hash = await digest(canonical(record));
    records.push(record);
    previousHash = record.hash;
  }
  const excluded = input.events.length - records.length;
  if (excluded)
    findings.push(
      finding(
        'info',
        'RETENTION_EXCLUDED',
        `${excluded} events fall outside the export retention window.`,
        `${excluded} eventos estão fora da janela de retenção da exportação.`,
      ),
    );
  return report(
    input,
    'evia-local-event-journal',
    [
      metric('retained', 'Retained events', 'Eventos mantidos', records.length),
      metric('excluded', 'Excluded events', 'Eventos excluídos', excluded),
      metric(
        'sessions',
        'Session codes',
        'Códigos de sessão',
        new Set(records.map((r) => r.sessionId)).size,
      ),
      metric(
        'integrity',
        'Chain check',
        'Verificação da cadeia',
        (await verifyRecords(records, previousHash)).valid ? 'valid' : 'invalid',
      ),
    ],
    findings,
    records,
    { rootHash: previousHash, cutoffMs, nowMs: input.nowMs, retentionMs: input.retentionMs },
  );
}
