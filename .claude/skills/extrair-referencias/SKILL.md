---
name: extrair-referencias
description: Extrai exemplos literais de referências bibliográficas de um PDF de normas, preservando negrito, itálico e agrupandopor seção. Use quando for processar o PDF de normas da UFC.
disable-model-invocation: true
argument-hint: [/Users/saviotp/Documents/Study/Extracurricular/ufc-zotero-plugin/docs/guias/GuiaNormalizacaoReferencias.pdf]
---

# Extrair Referências Bibliográficas — Normas UFC

## Contexto
O PDF contém seções de normas bibliográficas no formato UFC/ABNT.
Cada seção possui um título (ex: "3.1.1.2 Livros e/ou folhetos") seguido de uma caixa de exemplos com subseções "Elementos essenciais" e "Elementos complementares". Os exemplos devem ser extraídos literalmente para uso como base do plugin Zotero.

## Memórias
Consultar o arquivo de memórias em `.claude/memories/extrair-referencias.md` para detalhes sobre o processo de descoberta, mapeamento do PDF e decisões tomadas. Esta memória é crucial para entender o raciocínio por trás dos passos de extração e formatação.

## Pré-condições
- `pdfplumber` instalado (`pip install pdfplumber`)
- Arquivo PDF disponível em: $ARGUMENTS
- Diretório `docs/` existente no projeto (`mkdir -p docs/`)

## Mapeamento do PDF (descoberto em sessão anterior — não reexplorar)

**Offset de página:** página exibida no documento = índice PDF (0-based) + 1
- Exemplo: página 15 do documento = `pdf.pages[16]`

**Fontes identificadas:**
- `Montserrat-Regular` → texto simples
- `Montserrat-Bold` → **negrito** (título da obra)
- `Montserrat-Italic` → *itálico* (ex: *et al*, *E-book*)
- `MontserratAlternates-Bold` → número de página no rodapé — EXCLUIR
- `Mulish-Italic` size=16 → título de seção (ex: "3.1.1.1 Livros e/ou folhetos no todo")
- `Mulish-Bold` size=16 → título de capítulo (ex: "3 MODELOS DE REFERÊNCIAS")

**Caixa de exemplos:** rect com `w≈432`, `h>50`, que não seja a página inteira (`w<500`)
- "Elementos essenciais" subheader aparece no topo dessa caixa (top≈153)
- Gap entre linhas dentro de uma entrada: ~14pt
- Gap entre entradas distintas: ~29pt (usar como threshold para separar parágrafos)

## Passos

1. Abrir o PDF com `pdfplumber`
2. Varrer páginas no intervalo solicitado registrando o título de seção mais recente — identificado por `Mulish-Italic` size=16
3. Ao encontrar caixa de exemplos (`page.rects` com `w≈432`), entrar no modo de extração
4. Dentro da caixa, extrair APENAS os blocos sob "Elementos essenciais" — parar ao encontrar "Elementos complementares"
5. Processar formatação **ao nível do caractere** (`char["fontname"]`):
   - Concatenar todos os chars do parágrafo primeiro, depois renderizar
   - Isso evita marcadores quebrados como `**Título **\n**continuação**`
   - Detectar mudança de `ftype` (Bold/Italic/Regular) para abrir/fechar marcadores
6. Ao juntar linhas de um parágrafo: adicionar espaço se a linha anterior não terminar com espaço
   - Exceção: URLs quebradas — aplicar `re.sub(r'(https?://\S+) (\S+=\S+)', r'\1\2', text)` após renderizar
7. Agrupar as referências extraídas sob o título de seção registrado no passo 2
8. Salvar em `docs/referencias-ufc-exemplos.md` — ANEXAR ao arquivo existente, não sobrescrever

## Restrições
- NÃO parafrasear nenhum exemplo — copiar literalmente
- NÃO alterar pontuação, ordem ou capitalização
- NÃO extrair texto corrido fora das caixas de exemplos
- NÃO incluir "Elementos complementares"
- NÃO inferir formatação visualmente — usar apenas `fontname`

## Output esperado

Arquivo `docs/referencias-ufc-exemplos.md` com estrutura:
```markdown
## 3.1.1.2 Livros e/ou folhetos no todo em meio eletrônico

### Elementos essenciais

KOOGAN, André; HOUAISS, Antônio (ed.). **Enciclopédia e dicionário digital**. São Paulo: Delta, 1998. 5 CD-ROM.

CASTRO, José Esteban. **Água e democracia na América Latina**. Campina Grande: EDUEPB, 2016. *E-book*. Disponível em: http://books.scielo.org/id/tn4y9/pdf/castro-9788578794866.pdf. Acesso em: 22 ago. 2019.
```

## Critério de sucesso
- Cada seção do PDF tem sua seção correspondente no arquivo
- Todo negrito e itálico do original está preservado
- Nenhum exemplo foi alterado ou resumido
- Arquivo salvo em `docs/referencias-ufc-exemplos.md`