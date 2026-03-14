---
name: project-updates-bumpp
description: Lembrete para reabilitar makeUpdateJson quando configurar Bumpp e releases no GitHub.
type: project
---

`makeUpdateJson` está desabilitado no `zotero-plugin.config.ts` (valor `false`).

**Why:** Não temos releases ainda, então o update.json não é necessário agora. Mas quando configurarmos o Bumpp e o sistema de releases no GitHub (Fase 6), o update.json será necessário para que o Zotero detecte atualizações automáticas do plugin.

**How to apply:** Na Fase 6 (Setup GitHub / CI/CD / releases), reabilitar `makeUpdateJson` no `zotero-plugin.config.ts` e configurar os campos `updateURL` e `xpiDownloadLink` com os URLs corretos do repositório GitHub.
