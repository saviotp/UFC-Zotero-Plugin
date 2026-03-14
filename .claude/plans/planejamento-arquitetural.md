# Plano de Implementação — Plugin Zotero 8 UFC/ABNT

## Contexto

O objetivo é criar um plugin para o Zotero 8 que formate referências bibliográficas de acordo com o Guia de Normalização de Referências da UFC (baseado na ABNT-NBR 6023:2018). Já temos:
- **`ufc.csl`** — arquivo CSL com 20 macros e 26 tipos de referência, formato autor-data, locale pt-BR
- **`docs/referencias-ufc-exemplos.md`** — 67 seções com 138 referências extraídas literalmente do PDF da UFC (nossa "folha de respostas" para testes)
- **`docs/guias/GuiaNormalizacaoReferencias.pdf`** e **`docs/guias/GuiaNormalizaoCitacao.pdf`** — guias originais

O CSL sozinho já cobre boa parte da formatação, mas pode ter lacunas para tipos exóticos (psicografia, documentos civis, partituras). O plugin serve para: (1) instalar/registrar o CSL correto, (2) corrigir formatações que o CSL não consegue expressar via pós-processamento, e (3) oferecer uma experiência integrada ao usuário.

---

## Fase 1 — Validação do CSL atual (sem plugin ainda)

**O quê:** Comparar a saída do CSL com as 138 referências da folha de respostas.
**Por quê:** Antes de escrever código do plugin, precisamos saber exatamente quais formatações o CSL já acerta e quais falham.
**Como:**
1. Criar registros de teste no Zotero (ou via API) para cada tipo de referência coberto pelas 138 referências
2. Gerar as referências usando o CSL atual (`ufc.csl`)
3. Comparar automaticamente (diff) a saída com `docs/referencias-ufc-exemplos.md`
4. Catalogar as diferenças em um relatório de gaps

**Arquivos envolvidos:**
- `ufc.csl` (leitura)
- `docs/referencias-ufc-exemplos.md` (leitura — IMUTÁVEL)
- `tests/fixtures/` (novo — dados de teste Zotero JSON)
- `tests/validate_csl.py` (novo — script de validação)

**Resultado:** Lista precisa de correções necessárias no CSL e/ou via pós-processamento no plugin.

---

## Fase 2 — Correções no CSL

**O quê:** Ajustar `ufc.csl` para cobrir o máximo possível de formatações corretas.
**Por quê:** O CSL é o mecanismo nativo do Zotero — tudo que puder ser resolvido ali é mais simples e robusto do que pós-processamento via plugin.
**Como:**
1. Para cada gap identificado na Fase 1, avaliar se é corrigível via CSL
2. Aplicar as correções diretamente no XML do CSL
3. Re-rodar a validação da Fase 1 para confirmar

**Arquivos envolvidos:**
- `ufc.csl` (edição)

---

## Fase 3 — Scaffolding do Plugin Zotero 8

**O quê:** Criar a estrutura base do plugin usando o template oficial.
**Por quê:** O `zotero-plugin-template` do windingwind é o padrão da comunidade para Zotero 8, com ESBuild, TypeScript, hot-reload e scaffolding pronto.

### Tecnologias
| Tecnologia | Para quê |
|---|---|
| **TypeScript** | Linguagem principal do plugin (tipagem estática, autocomplete) |
| **ESBuild** | Bundler ultra-rápido que compila TS → JS para o Zotero |
| **zotero-plugin-scaffold** | CLI que empacota o plugin em `.xpi` e faz hot-reload durante dev |
| **zotero-plugin-toolkit** | Biblioteca auxiliar para UI, menus, preferências, atalhos |
| **Node.js + npm** | Gerenciador de dependências e scripts de build |

### Estrutura de diretórios (baseada no template)
```
ufc-zotero-plugin/
├── src/
│   ├── index.ts              # Entry point — registra o bootstrap
│   ├── modules/
│   │   ├── csl-manager.ts    # Instala/atualiza o CSL no Zotero
│   │   ├── post-processor.ts # Corrige formatações que o CSL não cobre
│   │   └── preferences.ts    # Tela de preferências do plugin
│   └── hooks.ts              # Lifecycle hooks (onStartup, onShutdown)
├── addon/
│   ├── chrome/
│   │   └── content/          # XUL/XHTML para UI (preferências, diálogos)
│   ├── locale/
│   │   └── pt-BR/            # Strings traduzidas
│   └── manifest.json         # Manifesto do plugin (id, versão, compatibilidade)
├── styles/
│   └── ufc-abnt.csl          # CSL validado e corrigido (cópia de ufc.csl)
├── tests/
│   ├── fixtures/             # Dados de teste (registros Zotero mock)
│   └── validate_csl.py       # Validação contra folha de respostas
├── docs/
│   └── referencias-ufc-exemplos.md  # Folha de respostas (IMUTÁVEL)
├── package.json
├── tsconfig.json
├── zotero-plugin.config.ts   # Config do scaffold
└── README.md
```

**Como:**
1. Fazer fork/clone do `windingwind/zotero-plugin-template`
2. Renomear e configurar (`package.json`, `manifest.json`, IDs do plugin)
3. Instalar dependências: `npm install`
4. Verificar que o build funciona: `npm run build`
5. Testar instalação no Zotero 8 local

**Arquivos envolvidos:**
- Todos os novos arquivos da estrutura acima

---

## Fase 4 — Funcionalidades Core do Plugin

### 4.1 — Gerenciador de CSL (`csl-manager.ts`)
**O quê:** Na inicialização do plugin, verifica se o estilo UFC-ABNT está instalado no Zotero e instala/atualiza automaticamente.
**Por quê:** O usuário não precisa instalar o CSL manualmente — o plugin cuida disso.
**Como:** Usar a API `Zotero.Styles.install()` para registrar o CSL bundled em `styles/ufc-abnt.csl`.

### 4.2 — Pós-processador (`post-processor.ts`)
**O quê:** Intercepta a geração de bibliografias e aplica correções para os gaps que o CSL não cobre.
**Por quê:** Alguns detalhes da norma UFC (tipos exóticos, formatações especiais) não são expressáveis em CSL puro.
**Como:** Registrar um listener via `Zotero.Notifier` ou usar o hook `notify` do toolkit para capturar eventos de geração de bibliografia e aplicar transformações no HTML resultante.

### 4.3 — Preferências (`preferences.ts`)
**O quê:** Tela simples de preferências para o usuário escolher opções (ex: ativar/desativar pós-processamento).
**Por quê:** Dá controle ao usuário e facilita debug.
**Como:** Usar `zotero-plugin-toolkit` para registrar o painel de preferências.

---

## Fase 5 — Testes automatizados

**O quê:** Suite de testes que compara a saída do plugin com as 138 referências da folha de respostas.
**Por quê:** Garante que qualquer mudança no CSL ou no pós-processador não quebre formatações que já estavam corretas.
**Como:**
1. Para cada referência em `docs/referencias-ufc-exemplos.md`, criar um fixture com os campos Zotero necessários
2. Gerar a referência via CSL + pós-processador
3. Comparar com o texto esperado (ignorando diferenças triviais como espaços extras)
4. Rodar como parte do CI no GitHub

**Arquivos envolvidos:**
- `tests/fixtures/*.json` (dados de teste)
- `tests/validate_csl.py` ou `tests/*.test.ts` (testes)
- `.github/workflows/test.yml` (CI)

---

## Fase 6 — Setup no GitHub

**O quê:** Configurar o repositório para colaboração e distribuição.
**Como:**
1. **Branch protection:** `main` protegida, PRs obrigatórias
2. **CI/CD:** GitHub Actions para build + testes em cada PR
3. **Releases:** GitHub Actions para gerar `.xpi` automaticamente em cada tag
4. **README:** Instruções de instalação para usuários finais
5. **.gitignore:** Configurado para node_modules, .venv, build/, *.xpi

---

## Ordem de execução

| # | Fase | Dependência | Estimativa de complexidade |
|---|---|---|---|
| 1 | Validação do CSL | nenhuma | Média |
| 2 | Correções no CSL | Fase 1 | Variável (depende dos gaps) |
| 3 | Scaffolding do plugin | nenhuma (paralelo com 1-2) | Baixa |
| 4 | Funcionalidades core | Fase 2 + 3 | Alta |
| 5 | Testes automatizados | Fase 1 + 4 | Média |
| 6 | Setup GitHub | Fase 3 | Baixa |

> **Nota:** As Fases 1-2 (CSL) e a Fase 3 (scaffolding) podem ser feitas em paralelo.

---

## Verificação (como testar end-to-end)

1. Instalar o plugin (`.xpi`) no Zotero 8
2. Criar um documento de teste com referências de vários tipos
3. Gerar a bibliografia usando o estilo "UFC-ABNT"
4. Comparar visualmente e automaticamente com `docs/referencias-ufc-exemplos.md`
5. Verificar que o CSL foi instalado automaticamente
6. Verificar que o pós-processador corrige os gaps catalogados

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| API do Zotero 8 pode não expor hooks para pós-processamento | Investigar `Zotero.Notifier`, DOM manipulation, ou monkey-patching como fallback |
| CSL não cobre tipos exóticos (psicografia, documentos civis) | Pós-processador no plugin trata esses casos |
| Mudanças futuras no Zotero 8 podem quebrar o plugin | Seguir o template oficial que é mantido pela comunidade |
| Folha de respostas pode ter erros residuais da extração | Validação manual das 4 referências que foram corrigidas à mão |
