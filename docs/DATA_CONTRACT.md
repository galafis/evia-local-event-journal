# Data contract · Contrato de dados

[README](../README.md) · [Machine-readable schema · Esquema para ferramentas](../schemas/scenario.schema.json)

## English

All inputs use schema version 1. Fields and units are explicit; numeric strings, nonfinite values and unknown fields are rejected. The structural JSON Schema assists editors and integrations. `validate()` in the domain engine also enforces semantic constraints such as ordering, uniqueness and cross-field relationships.

`source: "synthetic"` labels an illustrative scenario. `source: "manual"` means that a user supplied the values; it does not prove measurement, accuracy, permission or hardware origin. Keep original observation records separately when using manual data.

## Português

Todas as entradas usam a versão 1 do esquema. Campos e unidades são explícitos; números em texto, valores não finitos e campos desconhecidos são rejeitados. O JSON Schema estrutural auxilia editores e integrações. A função `validate()` também impõe restrições semânticas, como ordem, unicidade e relações entre campos.

`source: "synthetic"` identifica um cenário ilustrativo. `source: "manual"` significa que um usuário informou os valores; não comprova medição, precisão, autorização ou origem física. Mantenha os registros originais de observação separadamente ao usar dados manuais.

## Input fields · Campos de entrada

| Field · Campo   | English                                                        | Português                                                                 |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `schemaVersion` | Schema version; exactly 1                                      | Versão do esquema; exatamente 1                                           |
| `scenarioId`    | Public scenario code; no personal identifiers                  | Código público do cenário; sem identificadores pessoais                   |
| `source`        | synthetic or manual; an explicit provenance label              | synthetic ou manual; rótulo explícito de origem                           |
| `nowMs`         | Supplied review clock; no wall-clock dependency                | Relógio de revisão informado; sem dependência do relógio real             |
| `retentionMs`   | Inclusive export retention window                              | Janela inclusiva de retenção da exportação                                |
| `events`        | Explicit timestamped events; see the schema for allowed fields | Eventos explícitos com instante; consulte os campos permitidos no esquema |

## Complete nominal input · Entrada nominal completa

```json
{
  "schemaVersion": 1,
  "scenarioId": "local-session",
  "source": "synthetic",
  "nowMs": 10000,
  "retentionMs": 10000,
  "events": [
    {
      "id": "e-0001",
      "atMs": 0,
      "sessionId": "s-00000001",
      "kind": "session-start",
      "outcome": "ok"
    },
    {
      "id": "e-0002",
      "atMs": 2000,
      "sessionId": "s-00000001",
      "kind": "cue-presented",
      "outcome": "ok"
    },
    {
      "id": "e-0003",
      "atMs": 7000,
      "sessionId": "s-00000001",
      "kind": "session-pause",
      "outcome": "interrupted"
    },
    {
      "id": "e-0004",
      "atMs": 9000,
      "sessionId": "s-00000001",
      "kind": "observation",
      "outcome": "unknown"
    },
    {
      "id": "e-0005",
      "atMs": 10000,
      "sessionId": "s-00000001",
      "kind": "session-stop",
      "outcome": "ok"
    }
  ]
}
```

## Report envelope · Estrutura do relatório

| Field · Campo             | Meaning · Significado                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`           | Report format version · Versão do formato do relatório                                                                           |
| `analysisVersion`         | Version of the analysis implementation · Versão da implementação da análise                                                      |
| `projectId`, `scenarioId` | Public project and scenario codes · Códigos públicos de projeto e cenário                                                        |
| `source`                  | Input provenance label, preserved · Origem da entrada, preservada                                                                |
| `status`                  | `complete`, `review-notes` or `review-required`                                                                                  |
| `metrics`                 | Values with English/Portuguese labels and units · Valores com rótulos bilíngues e unidades                                       |
| `findings`                | Severity, stable code, bilingual message and optional context · Gravidade, código estável, mensagem bilíngue e contexto opcional |
| `records`                 | Full ordered domain result · Resultado de domínio completo e ordenado                                                            |

Additional project-specific fields are shown in the [complete nominal report](../examples/nominal.report.json). Stable field names remain in English in both interface languages to preserve interoperability.  
Campos específicos adicionais constam no [relatório nominal completo](../examples/nominal.report.json). Os nomes estáveis dos campos permanecem em inglês nos dois idiomas da interface para preservar a interoperabilidade.

## API

```js
import { run } from './src/engine.js';
const report = await run(scenario);
console.log(report.status, report.metrics);
```

Errors expose `code` and `localized.en` / `localized.pt`. No partially computed report is returned for invalid scenarios.  
Erros expõem `code` e `localized.en` / `localized.pt`. Cenários inválidos não retornam relatórios parcialmente calculados.
