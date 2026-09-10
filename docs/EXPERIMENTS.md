# Worked examples · Exemplos comentados

[README](../README.md)

**English:** These are executable synthetic scenarios. Each command recomputes the committed report. Change one field at a time, retain the source file and inspect unfavorable findings as well as headline metrics.

**Português:** Estes são cenários sintéticos executáveis. Cada comando recalcula o relatório versionado. Altere um campo por vez, preserve a entrada e inspecione achados desfavoráveis junto das métricas principais.

## Local session · Sessão local

```sh
node scripts/analyze.mjs examples/nominal.json report.json
```

[Scenario / Cenário](../examples/nominal.json) · [Expected report / Relatório esperado](../examples/nominal.report.json) · `complete`

| Metric · Métrica                    | Expected · Esperado |
| ----------------------------------- | ------------------- |
| Retained events / Eventos mantidos  | 5                   |
| Excluded events / Eventos excluídos | 0                   |
| Session codes / Códigos de sessão   | 1                   |
| Chain check / Verificação da cadeia | valid               |

## Retention window · Janela de retenção

```sh
node scripts/analyze.mjs examples/retention-window.json report.json
```

[Scenario / Cenário](../examples/retention-window.json) · [Expected report / Relatório esperado](../examples/retention-window.report.json) · `review-notes`

| Metric · Métrica                    | Expected · Esperado |
| ----------------------------------- | ------------------- |
| Retained events / Eventos mantidos  | 2                   |
| Excluded events / Eventos excluídos | 3                   |
| Session codes / Códigos de sessão   | 1                   |
| Chain check / Verificação da cadeia | valid               |

- `RETENTION_EXCLUDED`: 3 events fall outside the export retention window. / 3 eventos estão fora da janela de retenção da exportação.

## Reordered events · Eventos fora de ordem

```sh
node scripts/analyze.mjs examples/reordered-events.json report.json
```

[Scenario / Cenário](../examples/reordered-events.json) · [Expected report / Relatório esperado](../examples/reordered-events.report.json) · `complete`

| Metric · Métrica                    | Expected · Esperado |
| ----------------------------------- | ------------------- |
| Retained events / Eventos mantidos  | 5                   |
| Excluded events / Eventos excluídos | 0                   |
| Session codes / Códigos de sessão   | 1                   |
| Chain check / Verificação da cadeia | valid               |
