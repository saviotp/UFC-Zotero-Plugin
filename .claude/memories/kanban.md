---
name: kanban
description: Estado atual do projeto — o que foi feito, o que está em andamento e o que será feito. Atualizar ao atingir 90% do limite de sessão ou quando auto-compact estiver iminente.
type: project
---

## Feito
- Extração de 138 referências do PDF → `docs/referencias-ufc-exemplos.md`
- Plano de implementação → `.claude/plans/planejamento-arquitetural.md`
- Infraestrutura de testes CSL com citeproc-js → `tests/test_csl.mjs` (13 fixtures)
- Fase 1+2: Validação e correção do CSL — 5 correções, 7/13 testes passando
- Identificação de CSL (`ufc.csl` bloco `<info>`) atualizada: autor, links, contribuidores
- `package.json` atualizado: autor, licença AGPL-3.0, descrição, keywords, scripts de build
- Memória de licenças/créditos completa → `.claude/memories/licencas-creditos.md`
- Dependências do plugin instaladas: zotero-plugin-toolkit, zotero-plugin-scaffold, zotero-types, typescript, prettier
- Diretórios criados: `addon/`, `src/modules/`, `src/utils/`, `styles/`, `typings/`, `addon/locale/{pt-BR,en-US}`, `addon/content/`
- **Fase 3: Scaffolding — CONCLUÍDA** (13/13 arquivos criados, typecheck passa)
  - `addon/manifest.json` — manifesto com placeholders para o scaffold
  - `addon/bootstrap.js` — ponto de entrada Gecko (startup/shutdown/install/uninstall)
  - `addon/prefs.js` — valores padrão das preferências
  - `addon/content/preferences.xhtml` — tela de preferências (XHTML + Fluent)
  - `addon/locale/pt-BR/addon.ftl` — traduções português
  - `addon/locale/en-US/addon.ftl` — traduções inglês
  - `src/addon.ts` — classe Addon (singleton, estado global)
  - `src/hooks.ts` — funções de ciclo de vida (onStartup/onShutdown)
  - `src/index.ts` — entry point TypeScript (fachada para bootstrap.js)
  - `src/modules/csl-manager.ts` — instala/atualiza CSL no Zotero
  - `src/modules/post-processor.ts` — pós-processamento (subtítulo, en-dash, etc.)
  - `styles/ufc-abnt.csl` — cópia do CSL embutida no plugin
  - `typings/global.d.ts` — tipos globais Gecko/Zotero
  - `tsconfig.json` — configuração TypeScript (target ES2022, noEmit)
  - `zotero-plugin.config.ts` — configuração do scaffold/build

## Em andamento
- Testar build (`npm run build`) e verificar `.xpi` gerado

## A fazer
- **Fase 4:** Funcionalidades core — integrar csl-manager e post-processor nos hooks
  - Pós-processador: subtítulo no negrito, en-dash→hífen, legislação nota, filme caixa alta
- **Fase 5:** Expandir testes para 138 referências, CI no GitHub
- **Fase 6:** Setup GitHub (branch protection, CI/CD, releases .xpi)
- **LICENSES.md:** Documento explicando AGPL v3 (plugin) + CC BY-SA 3.0 (CSL)
- **README:** Instruções, créditos, preenchimento de dados no Zotero
