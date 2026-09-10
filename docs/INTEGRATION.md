# Integration · Integração

## English

Use synthetic events to design a minimal observation vocabulary alongside the public session prototypes. Before any real research record is collected, establish a separate protocol for consent, access, retention and deletion. Review provenance and expected roots outside the editable journal itself.

The public interface is a versioned scenario and report pair. Keep the scenario, report, source label and repository release together. Do not substitute private device messages for this schema or infer compatibility from similar field names. Device integration remains a separately scoped adapter.

## Português

Use eventos sintéticos para definir um vocabulário mínimo de observação junto aos protótipos públicos de sessão. Antes de coletar registros reais de pesquisa, estabeleça um protocolo separado para consentimento, acesso, retenção e exclusão. Revise a origem dos dados e as referências esperadas fora do próprio registro editável.

A interface pública é um par versionado de cenário e relatório. Mantenha juntos cenário, relatório, rótulo de origem e versão do repositório. Não substitua o esquema por mensagens privadas de dispositivos nem deduza compatibilidade de campos parecidos. A integração com dispositivos permanece um adaptador de escopo separado.

## Integrity API · API de integridade

```js
import { run, verifyRecords } from './src/engine.js';
const journal = await run(scenario);
const verification = await verifyRecords(journal.records, journal.rootHash);
console.log(verification.valid);
```

For meaningful comparison, retain the expected root outside the editable record set. This detects a change relative to that reference; it does not prove who created the records.  
Para uma comparação útil, mantenha a referência esperada fora do conjunto editável. Isso detecta alterações em relação à referência; não comprova quem criou os registros.
