export default {
  slug: 'evia-local-event-journal',
  title: 'Évia Local Event Journal',
  group: 'Évia',
  color: '#236f70',
  tagline: {
    en: 'Keep useful research events without collecting personal narratives.',
    pt: 'Registre eventos úteis de pesquisa sem coletar relatos pessoais.',
  },
  description:
    'EN: Évia companion prototype for local event records and integrity checks. PT: Protótipo complementar à Évia para registros locais de eventos e verificação de integridade.',
  topics: ['robotics', 'privacy', 'event-log', 'data-validation', 'reproducibility', 'javascript'],
  setting: {
    key: 'retentionMs',
    label: {
      en: 'Retention window (ms)',
      pt: 'Janela de retenção (ms)',
    },
    min: 0,
    max: 86400000,
    step: 1000,
  },
};
