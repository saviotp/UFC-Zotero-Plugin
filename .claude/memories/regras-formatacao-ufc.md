---
name: regras-formatacao-ufc
description: Regras específicas da UFC/ABNT para formatação de local (cidades homônimas) e edição (ordinal por idioma). Consultar ao trabalhar no CSL ou pós-processamento.
type: project
---

## Cidades homônimas (publisher-place)

- Somente acrescentar sigla do estado quando a cidade é homônima (existe em mais de um estado).
- Exemplos homônimos: Bom Jesus, PI / Bom Jesus, PB / Bom Jesus, RN / Barcelona, RN / Barcelona, España
- Cidades NÃO homônimas: usar apenas o nome, sem estado. Ex: "São Paulo" (não "São Paulo, SP").
- **Problema:** Zotero via ISBN preenche automaticamente com estado (ex: "Rio de Janeiro, RJ"). Será necessário pós-processamento ou orientação ao usuário.

**Why:** Regra explícita do Guia de Normalização de Referências da UFC.
**How to apply:** Avaliar se é viável manter uma lista de cidades homônimas brasileiras no plugin para limpeza automática, ou documentar como orientação ao usuário.

## Edição (edition)

- Transcrever usando abreviatura do ordinal + "edição" no idioma do documento.
- Português: `4. ed.`
- Inglês: `2nd ed.`
- O Zotero pode preencher como "2a edição" ou número puro ("4"). O CSL deve normalizar.

**Why:** Regra explícita do Guia UFC, seguindo ABNT-NBR 6023:2018.
**How to apply:** Verificar se o CSL atual formata corretamente o campo `edition` por idioma. Se o Zotero preencher texto livre (ex: "2a edição"), o plugin pode precisar normalizar para número antes de passar ao CSL.
