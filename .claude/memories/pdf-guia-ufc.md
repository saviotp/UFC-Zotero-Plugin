---
name: pdf-guia-ufc-estrutura
description: Mapeamento técnico do PDF GuiaNormalizacaoReferencias.pdf — offset de páginas, fontes, estrutura de caixas. Usar em qualquer skill que processe este PDF.
type: reference
---

## Arquivo
`docs/guias/GuiaNormalizacaoReferencias.pdf`

## Offset de páginas
Página exibida no documento ≠ índice pdfplumber (0-based).

| Página no documento | Índice pdfplumber |
|---------------------|-------------------|
| 15                  | 16                |
| 17                  | 18                |
| N                   | N + 1             |

**Por quê:** O PDF possui capa e sumário antes do conteúdo numerado, deslocando todos os índices em 1.

## Fontes identificadas

| Fontname (sufixo após `+`)      | Uso                                      | Ação                        |
|---------------------------------|------------------------------------------|-----------------------------|
| `Montserrat-Regular`            | Texto das referências                    | texto simples               |
| `Montserrat-Bold`               | Título da obra na referência             | `**negrito**`               |
| `Montserrat-Italic`             | Termos latinos (*et al*, *E-book*)       | `*itálico*`                 |
| `MontserratAlternates-Bold`     | Número de página no canto da folha       | **EXCLUIR**                 |
| `Mulish-Italic` size=16         | Título de subseção (ex: "3.1.1.1 ...")   | cabeçalho de seção          |
| `Mulish-Bold` size=16           | Título de capítulo (ex: "3 MODELOS ...") | cabeçalho de capítulo       |

O prefixo `MUFUZY+` aparece antes de todos os nomes — usar `'Bold' in fontname` e `'Italic' in fontname` para detectar, não comparação exata.

## Estrutura das caixas de exemplos

Cada seção de exemplos tem:
1. **Banner "Exemplos"** — rect pequeno (`w≈454, h≈29`) com label em Montserrat-Bold size=14
2. **Label "Elementos essenciais"** — rect pequeno (`w≈237, h≈32`) logo abaixo
3. **Caixa de conteúdo** — rect grande (`w≈432, h>50`) com as referências
4. **Label "Elementos complementares"** — quando presente, aparece na página seguinte com estrutura idêntica

Filtro para a caixa de conteúdo: `w > 100 and h > 50 and w < 500 and w < page_width - 50`

## Gaps verticais (coordenada `top`, em pontos)

| Situação                              | Gap aproximado |
|---------------------------------------|----------------|
| Entre linhas da mesma entrada         | ~14 pt         |
| Entre entradas distintas              | ~29 pt         |
| Threshold recomendado para parágrafo  | 22 pt          |

## Textos de header a ignorar na extração
```python
SKIP_HEADERS = ['Exemplos', 'Elementos essenciais', 'Elementos complementares']
```

## Fix de URL quebrada por linha
URLs que quebram de linha ficam com espaço no meio. Corrigir após renderizar:
```python
import re
text = re.sub(r'(https?://\S+) (\S+=\S+)', r'\1\2', text)
```

## Algoritmo de renderização (evita marcadores quebrados)
Concatenar **todos os chars do parágrafo primeiro**, depois renderizar de uma vez.
Não renderizar linha a linha — isso gera `**Título **\n**continuação**`.
