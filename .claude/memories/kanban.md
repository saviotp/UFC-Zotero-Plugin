---
name: kanban
description: Estado atual do projeto — o que foi feito, o que está em andamento e o que será feito. Atualizar ao atingir 90% do limite de sessão ou quando auto-compact estiver iminente.
type: project
---

## Feito
- Extração de 138 referências do PDF → `docs/referencias-ufc-exemplos.md`
- Plano de implementação → `.claude/plans/planejamento-arquitetural.md`
- Infraestrutura de testes CSL com citeproc-js → `tests/test_csl.mjs` (13 fixtures iniciais)
- Fase 1+2: Validação e correção do CSL — 5 correções, 7/13 testes passando
- Identificação da CSL (`ufc.csl` bloco `<info>`) atualizada: autor, links, contribuidores
- `package.json` atualizado: autor, licença AGPL-3.0, descrição, keywords, scripts de build
- Memória de licenças/créditos completa → `.claude/memories/licencas-creditos.md`
- Dependências do plugin instaladas: zotero-plugin-toolkit, zotero-plugin-scaffold, zotero-types, typescript, prettier
- **Fase 3: Scaffolding — CONCLUÍDA** (build gera `.xpi` válido)
  - Todos os arquivos do plugin criados (bootstrap, hooks, addon, index, prefs, locales, XHTML)
  - `zotero-plugin.config.ts` configurado com `build.define`, `source`, `prefs`, `fluent`
  - `.gitignore` criado (node_modules, build, .xpi, PDFs, .DS_Store)
  - PDFs movidos de raiz para `docs/guias/` (caminhos atualizados na skill e memórias)
  - Commit realizado: `feat: scaffolding completo do plugin Zotero 8 (Fases 1-3)`
- **Fase 4 (parcial): Integração dos módulos nos hooks — CONCLUÍDA**
  - `hooks.ts` atualizado: chama `installOrUpdateCSL()` e `postProcessor.register()` no startup
  - Shutdown chama `postProcessor.unregister()` (restaura função original do Zotero)
  - Try/catch por subsistema (degradação graciosa)
- **Fase 4: Pós-processador + testes — 137/137 passando (todas as 138 referências cobertas)**
  - 3 fixtures de jurisprudência corrigidos (3.6.3 Agravo, 3.6.4 MS STF, 3.6.4 SISLEX)
  - 16 novos fixtures adicionados nesta sessão:
    - 3.1.1.4 UFC Biblioteca (capítulo institucional + container-author)
    - 3.2.2 Carvalho (carta eletrônica)
    - 3.8.1 Tim Maia (DVD musical, tipo song)
    - 3.13.1 Elsevier ScienceDirect (base de dados)
    - 3.3.1 ×3 (coleções de periódicos — tipo periodical)
    - 3.3.2 ×1 (coleção eletrônica)
    - 3.3.3 ×1 (parte de coleção)
    - 3.3.4 ×1 (parte de coleção eletrônica)
    - 3.3.5 ×1 (fascículo — tipo article-journal)
    - 3.3.6 ×3 (fascículos eletrônicos — tipo periodical com/sem container-title)
    - 3.4.2.2 Serra (anais eletrônico — referência previamente truncada)
    - 3.6.3 Súmula STF (jurisprudência em livro — referência previamente truncada)
  - Arquivo `tests/test_csl_basic.py` apagado (obsoleto, citeproc-py com bug)
  - 137 testes = 138 referências − 1 duplicata (Farias 4 nomeados = mesmo livro que Farias et al)

## Correções no CSL nesta sessão
- Macro `title`: adicionado `legal_case` à lista de tipos sem bold
- Bloco `legal_case`: 3 branches (publisher=súmula em livro, URL=eletrônico com data curta, else=impresso com data longa)
- Bloco `periodical` (NOVO): coleções de periódicos e fascículos — container-title com sufixo condicional (`. ` com publisher-place, `, ` sem), note carrega datas/ISSN/volume
- Bloco `chapter`: `fixInstitutionalAuthor` expandido para incluir `container-author` (restaura caixa mista)

## 18 funções de pós-processamento em `test_csl.mjs`
0. `fixOrdinalSup` — `<sup>o/a</sup>` → `º/ª`
0b. `fixBookTitleEntry` — remove `<b>` de livros sem autor (entrada por título)
1. `fixSubtitleBold` — subtítulo fora do negrito (apenas `<b>`, não `<i>`)
2a. `fixPageEnDashToHyphen` — en-dash → hífen APENAS em intervalos de páginas
2b. `fixMonthRangeSeparator` — en-dash → barra entre meses (jul./dez.)
3. `fixLegislationNote` — reordena nota [Constituição (ano)] antes do título
5. `fixInstitutionalAuthor` — restaura caixa mista de subdivisões (author + container-author)
6. `fixEditorLabel` — `(org.)` → `(ed.)` quando editor substitui autor (não capítulo)
7. `fixEbookItalic` — "E-book" em `<i>` itálico
8. `fixFilmTitleCase` — primeira palavra em MAIÚSCULAS quando sem autor (inclui artigos)
9. `fixDuplicatePublisher` — remove editora quando igual ao autor
10. `fixBracketedTitle` — colchetes `[título]` fora do negrito (fotos, cartas)
11. `fixAnaisBrackets` — `<b>Anais [...]</b>` → `<b>Anais</b> [...]`
12. `fixBibleLanguageCase` — `BÍBLIA. PORTUGUÊS` → `BÍBLIA. Português`
13. `fixContainerTitleCase` — primeira palavra do container-title em MAIÚSCULAS (após *In*:)
14. `fixChapterNoPublisher` — remove `[s. n.]` em chapters sem editora (blogs)
15. `fixCertidaoDate` — `Registro em,` → `Registro em:` (vírgula → dois-pontos)
16. `fixEventJournalBold` — bold no nome do periódico em eventos tipo book com volume

## Seções cobertas (62 seções, 137 testes)
3.1.1.1 (9), 3.1.1.2 (5), 3.1.1.3 (5), 3.1.1.4 (3), 3.1.2.1 (2), 3.1.2.2 (1), 3.1.2.3 (1), 3.1.2.4 (1), 3.2.1 (3), 3.2.2 (2), 3.3.1 (3), 3.3.2 (1), 3.3.3 (1), 3.3.4 (1), 3.3.5 (1), 3.3.6 (3), 3.3.7 (4), 3.3.8 (3), 3.3.9 (2), 3.3.10 (1), 3.4.1.1 (1), 3.4.1.2 (1), 3.4.1.3 (1), 3.4.1.4 (1), 3.4.2.1 (2), 3.4.2.2 (2), 3.4.2.3 (1), 3.4.2.4 (1), 3.4.2.5 (1), 3.5.1 (1), 3.5.1e (2), 3.6.1 (3), 3.6.2 (2), 3.6.3 (2), 3.6.4 (2), 3.6.5 (3), 3.6.6 (2), 3.7.1 (1), 3.7.2 (2), 3.8.1 (4), 3.8.2 (1), 3.8.3 (2), 3.8.4 (3), 3.9.1 (2), 3.9.2 (2), 3.10.1 (3), 3.10.2 (1), 3.11.1 (3), 3.11.2 (2), 3.13.1 (2), 3.13.2 (2), 3.13.3 (2), 3.13.4 (3), 3.13.5 (2), 3.13.6 (1), 3.14.1 (2), 3.14.2 (1), 3.14.3 (2), 3.14.4 (2), 3.14.5 (3), 3.14.6 (1), 3.14.7 (2), 3.14.8 (2), 3.14.9 (1), 3.14.10 (1), 3.14.11 (1), 3.14.12 (1)

## A fazer
- Sincronizar funções de correção do `test_csl.mjs` com `post-processor.ts` (src/)
- Commit da Fase 4
- **Fase 5:** CI no GitHub
- **Fase 6:** Setup GitHub (branch protection, CI/CD, releases .xpi)
- **LICENSES.md:** Documento explicando AGPL v3 (plugin) + CC BY-SA 3.0 (CSL)
- **README:** Instruções, créditos, preenchimento de dados no Zotero
- Documentar mapeamento UFC → CSL de forma simples para o usuário final

## Decisões de design (acumuladas)
- **Mapeamento UFC → CSL padronizado:** cada tipo de referência UFC tem UM tipo CSL definido; não mudar sem justificativa
- **Trabalho não publicado (3.4.2.5):** usa `type: "thesis"` (único tipo que coloca ano após título)
- **Resenha em blog (3.14.4):** usa `type: "chapter"` + pós-processamento (opção A — aceita gap do CSL e corrige)
- **Artigos definidos/indefinidos:** fixFilmTitleCase e fixContainerTitleCase tratam O, A, OS, AS, UM, UMA, UNS, UMAS como artigos que acompanham a próxima palavra em MAIÚSCULAS
- **Apóstrofos:** citeproc-js converte `'` → `'` (U+2019); normalizamos de volta para ASCII no htmlToMarkdown
- **Ano duplicado em teses:** é proposital na ABNT (submissão + defesa); `original-date` no CSL permite diferenciar
- **Evento em periódico (3.4.1.3):** tipo `book` com volume+edition → bold no título + fixEventJournalBold para bold no periódico (via note). Tipo paper-conference para 3.4.1.4 (título plain, container-title bold)
- **Parte de tese (3.1.2.3/3.1.2.4):** tipo `chapter` com `genre` → ativa branch condicional que renderiza em formato tese (year → genre – note, publisher, place, year)
- **Certidão (3.7.1/3.7.2):** tipo `document` com publisher-place="Registro em" → fixCertidaoDate converte vírgula em dois-pontos
- **Redes sociais (3.13.4):** tipo `post` — note=local, container-title=plataforma (@handle)
- **Listas de discussão (3.13.2):** tipo `dataset` sem título — email como URL
- **31 fev. 2015:** data impossível do guia UFC (exemplo fictício). Fixture usa 28 fev. 2015 para compatibilidade com citeproc-js
- **Coleções de periódicos (3.3.1-4):** tipo `periodical`, título em CAPS (usuário entra assim), note carrega "datas. ISSN"
- **Fascículos (3.3.5):** tipo `article-journal` (fascículo dentro de periódico com container-title bold)
- **Fascículos eletrônicos (3.3.6):** tipo `periodical` — container-title com sufixo condicional (`. ` com publisher-place, `, ` sem); note carrega volume/data/ISSN
- **Jurisprudência (3.6.3/3.6.4):** legal_case com 3 branches — publisher (súmula em livro), URL (eletrônico: título com vírgula + data curta), else (impresso: título com ponto + data longa)
- **SISLEX CD-ROM (3.6.4):** tipo `chapter` com campo `archive` (não `medium`) para posicionar "1 CD-ROM" após a editora
