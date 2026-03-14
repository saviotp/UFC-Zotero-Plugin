# Desenvolvimento de Plugin para Zotero 8: Guia de Referências da UFC

## O que é este projeto?
Plugin para o Zotero 8 que formata referências bibliográficas de acordo com os Guias de Normalização de Referências e Citações da Universidade Federal do Ceará (UFC).

## Abordagem com o usuário
- Por favor, explique a mim cada etapa realizada para que eu entenda:
1. A necessidade de realização daquela etapa;
2. O objetivo final daquela etapa;
3. Como a etapa está sendo executada tecnicamente (quais arquivos, quais funções, quais bibliotecas);
4. Quais decisões de design estão sendo tomadas e por quê (ex: escolha de biblioteca, estrutura de dados, organização de arquivos);
5. Quais desafios ou limitações estão sendo encontrados e como estão sendo superados.

## Gestão de sessão
- Quando o uso das 5 horas atingir 90%, OU quando o auto-compact estiver iminente (~5%), PARE o trabalho e:
  1. Atualize `.claude/memories/kanban.md` com: o que foi feito, o que está sendo feito e o que será feito;
  2. Avise o usuário para digitar `/exit` e encerrar a sessão.
- **Nota:** O modelo NÃO tem acesso à porcentagem de uso nem ao estado do auto-compact. O monitoramento depende do usuário avisar ou do sistema notificar compressão.
- **Boa prática:** Salvar o kanban a cada marco importante do trabalho, sem esperar o limite.
- **Motivo:** Ao iniciar nova sessão, ~18% do limite é consumido para carregar contexto. Salvar antes garante continuidade sem perda.

## Regras imutáveis
- Não alterarás o arquivo `docs/referencias-ufc-exemplos.md`;
- A formatação de referências seguirá rigorosamente o Guia de Normalização de Referências da UFC, de acordo com o documento citado;
- O plugin deverá iterar sobre o arquivo .CSL `ufc.csl` para aplicar as regras de formatação;

## Ambiente de desenvolvimento
- Python: `.venv` (ativar com `source .venv/bin/activate`)
- Dependências Python: `pip install -r requirements.txt`
- Dependências JS: `npm install` (citeproc + citeproc-locales para testes)
- Testes CSL: `node tests/test_csl.mjs` (usa citeproc-js, mesma engine do Zotero)
- **NÃO usar citeproc-py** para testes (tem bug: ignora `initialize="false"`, abrevia nomes erroneamente)

## Estado atual do projeto

### Fase 1+2: Validação e correção do CSL — CONCLUÍDA
Resultado: **7/13 testes passando**. Os 6 restantes requerem pós-processamento no plugin.

**Correções aplicadas ao `ufc.csl`:**
1. Term `et-al` → "et al" (sem ponto, ponto fica fora do itálico como a UFC exige)
2. Label `(org.)` para editores em capítulos (`<label>` na macro `container-contributors`)
3. Term `editor` short → sempre "org." (singular, mesmo com múltiplos editores)
4. Tese: campo `note` com travessão `–` antes da universidade (faculdade/departamento)
5. Jornal: prefixo "ano" no volume (`prefix="ano "` no bloco `article-newspaper`)
6. Patente: fixture corrigido para usar `publisher` (depositante) e `publisher-place` (país)

**Gaps que requerem pós-processamento no plugin (não corrigíveis no CSL):**
| Problema | Testes afetados | Solução no plugin |
|---|---|---|
| Subtítulo dentro do negrito (`**Título: sub**` → `**Título**: sub`) | livro, capítulo, artigo, legislação | Regex: mover `**` do `:` para antes |
| En-dash → hífen nas páginas (`–` → `-`) | capítulo, artigo | Replace simples |
| Legislação: nota `[Constituição]` antes do título | legislação | Reordenar campos no HTML |
| Filme sem autor: título em caixa alta | filme | Uppercase na primeira palavra |
| Autoria institucional: caixa alta excessiva no `literal` | livro institucional | Depende dos dados de entrada |

### Próxima fase: Fase 3 — Scaffolding do Plugin
Consultar `.claude/plans/planejamento-arquitetural.md` para detalhes.

## Documentação futura (README)
Planejado para fase posterior: instruções de uso, preenchimento de dados no Zotero, créditos (ABNT, UFC, Biblioteca Universitária), licenças, agradecimentos.

## Memórias do projeto
Arquivos de conhecimento acumulado ficam em `.claude/memories/`:
- `pdf-guia-ufc.md` — mapeamento técnico do PDF (offset de páginas, fontes, estrutura de caixas)
- `regras-formatacao-ufc.md` — regras UFC para cidades homônimas e edição por idioma
- `kanban.md` — estado atual do trabalho (o que foi feito / em andamento / a fazer)

## Commit
Os commits devem ser realizados seguindo a convenção presente em `.claude/skills/commit/SKILL.md`.

## Referências de Arquitetura do Projeto
Consultar na primeira vez; depois, somente quando a estrutura precisar ser modificada.
1. https://github.com/windingwind/zotero-plugin-template
2. https://github.com/windingwind/zotero-plugin-toolkit
3. https://www.zotero.org/support/dev/client_coding/plugin_development
4. https://www.zotero.org/support/dev/zotero_8_for_developers
