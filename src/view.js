import { svg, label, esc, fmt, text } from './ui.js';
export const interpretation = {
  en: 'The export accepts only bounded event codes. Opaque identifiers can still be linked to people elsewhere. Retention filters this export; it does not erase source files. An unkeyed hash chain is not a digital signature.',
  pt: 'A exportação aceita apenas códigos de eventos delimitados. Identificadores opacos ainda podem ser associados a pessoas em outros sistemas. A retenção filtra esta exportação; não apaga arquivos de origem. A cadeia de hashes sem chave não é uma assinatura digital.',
};
export const cursorMax = (r) => Math.max(0, r.records.length - 1);
export function render(r, lang, cursor) {
  const selected = r.records[cursor],
    types = ['session-start', 'session-pause', 'session-stop', 'cue-presented', 'observation'];
  const translated = {
    'session-start': ['Start', 'Início'],
    'session-pause': ['Pause', 'Pausa'],
    'session-stop': ['Stop', 'Encerramento'],
    'cue-presented': ['Cue', 'Sinal'],
    observation: ['Observation', 'Observação'],
  };
  const counts = types.map((kind) => r.records.filter((e) => e.kind === kind).length),
    maximum = Math.max(1, ...counts);
  let content = label(
    22,
    27,
    text('Retained event categories', 'Categorias dos eventos mantidos', lang),
  );
  types.forEach((kind, i) => {
    const y = 47 + i * 44,
      width = (counts[i] / maximum) * 500;
    content +=
      label(20, y + 20, translated[kind][lang === 'pt' ? 1 : 0]) +
      `<rect x="150" y="${y}" width="${width}" height="28" rx="5" fill="var(--accent)" opacity="${selected?.kind === kind ? 1 : 0.55}"/>` +
      label(164 + width, y + 20, counts[i]);
  });
  const detail = selected
    ? `${selected.id} · ${selected.sessionId} · ${fmt(selected.atMs, lang, 0)} ms · ${selected.outcome}`
    : text('No records in the retention window.', 'Nenhum registro na janela de retenção.', lang);
  return (
    svg(
      content,
      text('Counts by retained event category', 'Contagem por categoria de evento mantido', lang),
    ) +
    `<p class="visual-note"><strong>${esc(detail)}</strong><br>${esc(text('Final hash', 'Hash final', lang))}: <code>${esc(r.rootHash.slice(0, 24))}…</code></p>`
  );
}
