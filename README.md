# UFC Title Formatter — Plugin para Zotero 8+

[![Zotero 8+](https://img.shields.io/badge/Zotero-8+-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![GitHub release](https://img.shields.io/github/v/release/saviotp/UFC-Zotero-Plugin?style=flat-square)](https://github.com/saviotp/UFC-Zotero-Plugin/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square)](/LICENSE)

Plugin + estilo CSL para formatar referências e citações no **Zotero 8** conforme as normas **ABNT (NBR 6023:2018 / NBR 10520:2023)** interpretadas pelos **Guias de Normalização da UFC** (2022–2025).

---

## Índice

- [O que faz](#o-que-faz)
- [Instalação](#instalação)
- [Observações gerais sobre preenchimento](#observações-gerais-sobre-preenchimento)
- [Tipos de referência](#tipos-de-referência)
  - [Livro](#livro)
  - [Capítulo de livro](#capítulo-de-livro)
  - [Tese / Dissertação / TCC](#tese--dissertação--tcc)
  - [Artigo de periódico](#artigo-de-periódico)
  - [Artigo de jornal](#artigo-de-jornal)
  - [Trabalho em evento (anais)](#trabalho-em-evento-anais)
  - [Evento no todo](#evento-no-todo)
  - [Evento no todo em publicação periódica](#evento-no-todo-em-publicação-periódica)
  - [Parte de evento em publicação periódica](#parte-de-evento-em-publicação-periódica)
  - [Legislação em livro](#legislação-em-livro)
  - [Legislação em Diário Oficial](#legislação-em-diário-oficial)
  - [Jurisprudência em periódico](#jurisprudência-em-periódico)
  - [Súmula em livro](#súmula-em-livro)
  - [Patente](#patente)
  - [Norma técnica](#norma-técnica)
  - [Página web](#página-web)
  - [Filme / Vídeo](#filme--vídeo)
  - [Documento sonoro (CD, faixa)](#documento-sonoro-cd-faixa)
  - [Mapa / Atlas](#mapa--atlas)
  - [Documento iconográfico](#documento-iconográfico)
  - [Correspondência](#correspondência)
  - [Parte de publicação periódica (fascículo)](#parte-de-publicação-periódica-fascículo)
  - [Documento em CD-ROM (parte)](#documento-em-cd-rom-parte)
  - [Documento em CD-ROM (coleção)](#documento-em-cd-rom-coleção)
- [Limitações conhecidas do CSL](#limitações-conhecidas-do-csl)
- [Referências normativas](#referências-normativas)
- [Licença](#licença)

---

## O que faz

### Plugin (UFC Title Formatter)

| Funcionalidade | Descrição |
|---|---|
| **Negrito automático no título** | Ao salvar ou importar um item, aplica `<b>` no campo correto conforme ABNT. Obras autônomas (livros, teses, etc.) → negrito no `title`. Partes de obra (artigos, capítulos) → negrito no `publicationTitle`. |
| **Normalização da edição** | Converte automaticamente o campo `Edition` para número puro (ex: `2a edição` → `2`), garantindo que o CSL gere `2. ed.` conforme ABNT. |
| **Sentence case** | Corrige títulos importados em MAIÚSCULAS para minúsculas (sentence case), preservando siglas (UFC, ABNT, CNPq, etc.). |
| **Menu de contexto** | Botão direito → *"Formatar título (ABNT/UFC)"* para formatar manualmente itens selecionados. |

### Estilo CSL (ABNT UFC)

Formata referências e citações seguindo rigorosamente os Guias de Normalização da UFC para todos os tipos documentais suportados.

---

## Instalação

### Plugin

1. Baixe o arquivo `.xpi` da [última release](https://github.com/saviotp/UFC-Zotero-Plugin/releases/latest).
2. No Zotero: **Ferramentas → Complementos → ⚙ → Instalar complemento a partir de arquivo…**
3. Selecione o `.xpi` baixado e reinicie o Zotero.

### Estilo CSL

1. Baixe o arquivo [`abnt-ufc.csl`](./abnt-ufc.csl) deste repositório.
2. No Zotero: **Editar → Preferências → Citar → + (adicionar estilo)**
3. Selecione o `.csl` baixado.

---

## Observações gerais sobre preenchimento

### Campo Extra
O campo **Extra** do Zotero é a principal ferramenta para informações que não têm campo dedicado. Ele aceita variáveis CSL no formato `variavel: valor`, uma por linha:

```
author: Brasil
publisher-place: Brasília, DF
publisher: Casa Civil
note: Poder Executivo
```

O Zotero injeta esses valores diretamente no CSL-JSON ao exportar.

### Autores literais (institucionais)
Para autores que são entidades (países, organizações, eventos), clique no ícone de alternância ao lado do campo de autor no Zotero para mudar para campo único — assim ele aceita a string inteira sem separar nome/sobrenome.

### Locais inferidos
Quando o local não consta na fonte mas é conhecido, coloque entre colchetes diretamente no campo:
```
[Fortaleza]
```

### Intervalo de meses
O CSL não suporta intervalos de meses (ex: `jul./dez.`). Coloque o intervalo diretamente no campo de data como texto via **Extra**:
```
issued: 2006-07
```
E ajuste manualmente na saída final se necessário.

---

## Tipos de referência

---

### Livro

**Saída esperada:**
```
MARCONI, Marina de Andrade; LAKATOS, Eva Maria. Metodologia científica.
4. ed. São Paulo: Atlas, 2004.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Book` | |
| **Author** | `Marconi, Marina de Andrade` | Adicione cada autor separadamente. |
| **Title** | `Metodologia científica` | O plugin aplica `<b>` automaticamente. |
| **Edition** | `4` | Apenas o número. O CSL gera `4. ed.` |
| **Place** | `São Paulo` | |
| **Publisher** | `Atlas` | Para duas editoras: `Bertrand Brasil: FAPERJ` |
| **Date** | `2004` | |
| **# of Pages** | `305` | (Opcional) Gera `305 p.` |

---

### Capítulo de livro

**Saída esperada:**
```
MULLER, Geraldo. O macroeixo São Paulo–Buenos Aires. In: CASTRO, Iná Elias de;
MIRANDA, Mariana; EGLER, Claudio (org.). Redescobrindo o Brasil: 500 anos depois.
Rio de Janeiro: Bertrand Brasil: FAPERJ, 1999. p. 41-55.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Book Section` | |
| **Author** | `Muller, Geraldo` | Autor do capítulo. |
| **Title** | `O macroeixo São Paulo–Buenos Aires` | Título do capítulo (sem negrito). |
| **Editor** | `Castro, Iná Elias de` | Organizador(es). Adicione cada um separadamente. |
| **Book Title** | `Redescobrindo o Brasil: 500 anos depois` | Título do livro (recebe `<b>`). |
| **Place** | `Rio de Janeiro` | |
| **Publisher** | `Bertrand Brasil: FAPERJ` | |
| **Date** | `1999` | |
| **Pages** | `41-55` | |

> ⚠️ **Organizadores vs. Editores:** Se a referência mostra `(org.)`, cadastre os responsáveis no campo **Editor** do Zotero. O CSL exibirá automaticamente `(org.)` conforme configuração no campo **Extra** do item se necessário. Se a referência mostra `(ed.)`, o comportamento é o padrão.

> ⚠️ **Capítulo sem autor:** Quando não há autor, o título do capítulo aparece automaticamente em MAIÚSCULAS, conforme ABNT. Digite o título normalmente — o CSL cuida da formatação.

---

### Tese / Dissertação / TCC

**Saída esperada:**
```
BENEGAS, M. Três ensaios em análise econômica. 2006. Tese (Doutorado em
Economia) – Faculdade de Economia, Administração, Atuária e Contabilidade,
Universidade Federal do Ceará, Fortaleza, 2006.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Thesis` | |
| **Author** | `Benegas, M.` | |
| **Title** | `Três ensaios em análise econômica` | O plugin aplica `<b>`. |
| **Type** | `Tese (Doutorado em Economia) – Faculdade de Economia, Administração, Atuária e Contabilidade` | ⚠️ Inclua o tipo, nível e a faculdade/centro neste campo. |
| **University** | `Universidade Federal do Ceará` | Apenas a universidade. |
| **Place** | `Fortaleza` | |
| **Date** | `2006` | Data de defesa. O ano aparece duas vezes na saída (após título e no final). |
| **URL** | `http://www.repositorio.ufc.br/...` | (Se disponível) |
| **Accessed** | `2019-02-13` | |

---

### Artigo de periódico

**Saída esperada:**
```
HOFFMANN, C. A autoridade e a questão do pai. Ágora: estudos em teoria
psicanalítica, Rio de Janeiro, v. 9, n. 2, p. 169-176, jul. 2006.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Journal Article` | |
| **Author** | `Hoffmann, C.` | |
| **Title** | `A autoridade e a questão do pai` | Sem negrito. |
| **Publication** | `Ágora: estudos em teoria psicanalítica` | Nome do periódico (recebe `<b>`). |
| **Place** | `Rio de Janeiro` | |
| **Volume** | `9` | |
| **Issue** | `2` | Número do fascículo (`n.`). |
| **Pages** | `169-176` | Só os números. O CSL adiciona `p.` automaticamente. |
| **Date** | `2006-07` | Ano-mês. O CSL gera `jul. 2006`. |
| **URL** | `https://...` | (Se disponível) |
| **Accessed** | `2019-02-14` | |

> ⚠️ **Artigo sem autor:** A primeira palavra do título deve estar em MAIÚSCULAS. Digite diretamente no campo Title: ex. `ACONTECEU há cem anos`.

---

### Artigo de jornal

**Saída esperada (com seção):**
```
BOECHAT. Anac suspende empresa dona do helicóptero. O Estado, Fortaleza,
ano 82, n. 23.475, 14 fev. 2019. Caderno Nacional, p. 6. Disponível em:
http://www.oestadoce.com.br/digital. Acesso em: 14 fev. 2019.
```

**Saída esperada (sem seção):**
```
HOLANDA, Carlos. Emendas continuam a ser instrumentos de barganha.
O Povo, Fortaleza, ano 92, n. 30.730, p. 20, 18 ago. 2019.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Newspaper Article` | |
| **Author** | `Barros, Luana` | Para autores de nome único (ex: Boechat), use autor literal. |
| **Title** | `STF deve concluir hoje julgamento...` | |
| **Publication** | `O Povo` | Nome do jornal (recebe `<b>`). |
| **Place** | `Fortaleza` | |
| **Volume** | `ano 43` | ⚠️ Coloque `ano X` como texto. O CSL não adiciona `v.` para jornais. |
| **Issue** | `30.547` | Número da edição. |
| **Date** | `2019-02-14` | Data completa. |
| **Section** | `Caderno política` | (Opcional) Quando presente, muda a ordem: data vem antes da seção e página. |
| **Pages** | `11` | Só o número. O CSL adiciona `p.` automaticamente. |
| **URL** | `https://...` | (Se disponível) |
| **Accessed** | `2019-02-14` | |

> ⚠️ **Autor de nome único:** A ABNT usa `:` após o nome (ex: `BOECHAT:`). Como o CSL não detecta isso automaticamente, inclua os dois pontos diretamente no sobrenome no Zotero: campo Family = `BOECHAT:`, campo Given = vazio.

---

### Trabalho em evento (anais)

**Saída esperada:**
```
DIAS, R. L. Parque Nacional do Pico da Neblina. In: CONGRESSO BRASILEIRO
DE UNIDADES DE CONSERVAÇÃO, 4., 2004, Curitiba. Anais [...]. Curitiba:
Fundação Boticário de Proteção à Natureza, 2004. p. 45-54.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Conference Paper` | |
| **Author** | `Dias, R. L.` | |
| **Title** | `Parque Nacional do Pico da Neblina` | |
| **Conference Name** | `CONGRESSO BRASILEIRO DE UNIDADES DE CONSERVAÇÃO, 4., 2004, Curitiba` | ⚠️ Inclua número da edição, ano e local. |
| **Proceedings Title** | `Anais [...]` | |
| **Place** | `Curitiba` | |
| **Publisher** | `Fundação Boticário de Proteção à Natureza` | |
| **Date** | `2004` | |
| **Pages** | `45-54` | |

---

### Evento no todo

**Saída esperada:**
```
CONGRESSO DE ECOLOGIA DO BRASIL, 6., 2003, Fortaleza. Anais [...].
Fortaleza: UFC, 2003.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Book` | |
| **Author** (literal) | `CONGRESSO DE ECOLOGIA DO BRASIL, 6., 2003, Fortaleza` | ⚠️ Use campo único (autor literal). O local ficará em MAIÚSCULAS — é a limitação conhecida do CSL. |
| **Title** | `Anais [...]` | |
| **Place** | `Fortaleza` | |
| **Publisher** | `UFC` | |
| **Date** | `2003` | |

> ⚠️ **MAIÚSCULAS no local:** O CSL aplica uppercase em todo o autor literal (incluindo o local do evento). Não há como evitar sem edição manual. Digite o local em MAIÚSCULAS no campo de autor se desejar consistência visual: `CONGRESSO DE ECOLOGIA DO BRASIL, 6., 2003, FORTALEZA`.

---

### Evento no todo em publicação periódica

**Saída esperada:**
```
SEMINÁRIO INTERNACIONAL DE HISTÓRIA DA LITERATURA, 6., 2005, Porto Alegre.
Anais [...]. Cadernos do Centro de Pesquisas Literárias da PUCRS. Porto Alegre:
Ed. PUCRS, v. 12, n. 1, 2006.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Book` | |
| **Author** (literal) | `SEMINÁRIO INTERNACIONAL DE HISTÓRIA DA LITERATURA, 6., 2005, Porto Alegre` | |
| **Title** | `Anais [...]. Cadernos do Centro de Pesquisas Literárias da PUCRS` | Inclua o título da série no campo título. |
| **Volume** | `12` | Número do volume (`v.`). |
| **Edition** | `1` | ⚠️ Usado aqui como número do fascículo (`n.`). Quando `Volume` + `Edition` estão preenchidos simultaneamente, o CSL trata como evento em periódico e gera `v. 12, n. 1, ano` — sem `X. ed.` |
| **Place** | `Porto Alegre` | |
| **Publisher** | `Ed. PUCRS` | |
| **Date** | `2006` | |

---

### Parte de evento em publicação periódica

**Saída esperada:**
```
ABREU, Márcia. O perigo dos livros. Cadernos do Centro de Pesquisas
Literárias da PUCRS, Porto Alegre, v. 12, n. 1, p. 41-51, 2006. Trabalho
apresentado no Seminário Internacional de História da Literatura, 6.,
2005, Porto Alegre.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Journal Article` | |
| **Author** | `Abreu, Márcia` | |
| **Title** | `O perigo dos livros` | |
| **Publication** | `Cadernos do Centro de Pesquisas Literárias da PUCRS` | |
| **Place** | `Porto Alegre` | |
| **Volume** | `12` | |
| **Issue** | `1` | |
| **Pages** | `41-51` | |
| **Date** | `2006` | |
| **Extra** | `note: Trabalho apresentado no Seminário Internacional de História da Literatura, 6., 2005, Porto Alegre` | A nota aparece após a data, antes da URL. |

---

### Legislação em livro

**Saída esperada:**
```
BRASIL. [Constituição (1988)]. Constituição da República Federativa do Brasil:
promulgada em 5 de outubro de 1988, atualizada até a Emenda Constitucional
nº 39, de 19 de dezembro de 2002. 31. ed. São Paulo: Saraiva, 2003.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Bill` | |
| **Title** | `Constituição da República Federativa do Brasil: promulgada em 5 de outubro de 1988, atualizada até a Emenda Constitucional nº 39, de 19 de dezembro de 2002` | |
| **Bill Number** | *(vazio)* | Deixe vazio para Constituição. |
| **Date** | `2003` | |
| **Extra** | `author: Brasil` | |
| | `note: [Constituição (1988)].` | Aparece entre o autor e o título. |
| | `edition: 31` | Gera `31. ed.` |
| | `publisher-place: São Paulo` | |
| | `publisher: Saraiva` | |

> ⚠️ O Zotero não exporta o campo **Sponsor** para o CSL. Use sempre `author:` no campo **Extra** para o ente governamental.

---

### Legislação em Diário Oficial

**Saída esperada:**
```
BRASIL. Decreto n° 6.063, de 20 de março de 2007. Regulamenta no âmbito
federal, dispositivos da Lei n° 11.284 de 2 de março de 2006. Diário Oficial
[da] República Federativa do Brasil, Poder Executivo, Brasília, DF,
21 mar. 2007. Seção 1, p. 1.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Bill` | |
| **Bill Number** | `Decreto n° 6.063, de 20 de março de 2007` | Número e data do ato. |
| **Title** | `Regulamenta no âmbito federal, dispositivos da Lei n° 11.284...` | Ementa. |
| **Code** | `Diário Oficial [da] República Federativa do Brasil` | Nome do Diário Oficial. |
| **Section** | `Seção 1` | (Opcional) |
| **Pages** | `1` | |
| **Date** | `2007-03-21` | Data de publicação no Diário. |
| **Extra** | `author: Brasil` | |
| | `publisher-place: Brasília, DF` | Local de publicação. |
| | `note: Poder Executivo` | Aparece após o nome do Diário. |
| | `issue: 16.436` | (Quando houver número do Diário) Gera `n. 16.436`. |

> ⚠️ O CSL detecta automaticamente se é Diário Oficial pelo campo **Code** (`container-title`). Quando preenchido, usa o layout de Diário Oficial; quando vazio, usa o layout de livro.

---

### Jurisprudência em periódico

**Saída esperada:**
```
BRASIL. Supremo Tribunal Federal. Mandado de Segurança nº 32.941.
Relator: Ministro Marcos Aurélio. Brasília, DF, 18 de agosto de 2015.
Diário da Justiça Eletrônico, Brasília, DF, n. 203, p. 28, 9 out. 2015.
Disponível em: https://... Acesso em: 8 set. 2020.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Case` | |
| **Case Name** | `Mandado de Segurança nº 32.941. Relator: Ministro Marcos Aurélio` | ⚠️ Inclua tipo do processo, número e relator neste campo. Partes processuais também podem ser incluídas aqui. |
| **Court** | `Supremo Tribunal Federal` | |
| **Reporter** | `Diário da Justiça Eletrônico` | Nome do periódico/diário de publicação. |
| **Volume** | *(vazio)* | |
| **Pages** | `28` | |
| **Date Decided** | `2015-08-18` | Data da decisão. Gera `18 de agosto de 2015`. |
| **URL** | `https://www.stf.jus.br/...` | |
| **Accessed** | `2020-09-08` | |
| **Extra** | `author: Brasil` | País. |
| | `publisher-place: Brasília, DF` | Local da decisão. |
| | `archive-place: Brasília, DF` | Local de publicação do periódico. |
| | `issue: 203` | Número do periódico/diário. |
| | `note: 9 out. 2015` | Data de publicação no periódico. |

---

### Súmula em livro

**Saída esperada:**
```
BRASIL. Supremo Tribunal Federal. Súmula n° 14. In: BRASIL. Supremo
Tribunal Federal. Súmulas. São Paulo: Associação dos Advogados do Brasil,
1994. p. 16.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Case` | |
| **Case Name** | `Súmula n° 14` | |
| **Court** | `Supremo Tribunal Federal` | |
| **Reporter** | `Súmulas` | Título do livro. |
| **Pages** | `16` | |
| **Date** | `1994` | |
| **Extra** | `author: Brasil` | |
| | `publisher-place: São Paulo` | |
| | `publisher: Associação dos Advogados do Brasil` | ⚠️ Quando `publisher` está preenchido, o CSL usa o layout de livro com `In:`. |
| | `note: Brasil. Supremo Tribunal Federal.` | Repetição do ente antes do `In:`. |

---

### Patente

**Saída esperada:**
```
ARAÚJO, Francisco José Freire de. Processo para o preparo do adubo de
caranguejo. Depositante: Universidade Federal do Ceará. BR n. PI0704286-8 A2.
Depósito: 9 nov. 2007. Concessão: 7 jul. 2009. Disponível em: https://...
Acesso em: 27 nov. 2023.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Patent` | |
| **Inventor** | `Araújo, Francisco José Freire de` | |
| **Title** | `Processo para o preparo do adubo de caranguejo` | |
| **Patent Number** | `PI0704286-8 A2` | |
| **Filing Date** | `2007-11-09` | Data de depósito. |
| **Issue Date** | `2009-07-07` | Data de concessão. |
| **URL** | `https://busca.inpi.gov.br/...` | |
| **Accessed** | `2023-11-27` | |
| **Extra** | `publisher: Universidade Federal do Ceará` | ⚠️ Depositante. O campo **Assignee** nativo do Zotero **não exporta** para o CSL — use obrigatoriamente o Extra. |
| | `publisher-place: BR` | ⚠️ País. O campo **Country** nativo do Zotero **não exporta** para o CSL — use obrigatoriamente o Extra. |

> ⚠️ **Importante:** Os campos **Assignee** e **Country** da aba de patentes no Zotero ficam presos no banco interno e **não são exportados** para o CSL-JSON. É obrigatório usar o campo **Extra** com `publisher:` e `publisher-place:` para que apareçam na referência.

> ⚠️ **Links do INPI:** Os links copiados do sistema pePI do INPI frequentemente contêm espaços codificados (`%20`) extras ao final da URL. Remova os `%20` excedentes antes de colar no Zotero. Exemplo:
> - ❌ `...SearchParameter=PI0704286-8%20%20%20%20%20%20%20%20&Resumo=`
> - ✅ `...SearchParameter=PI0704286-8&Resumo=`

> ⚠️ **Procurador:** Quando houver procurador, inclua-o no campo do depositante: `publisher: GE Aviation Systems Limited (GB). Procurador: Jacques Labrunie`

---

### Norma técnica

**Saída esperada:**
```
ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 6023: informação e
documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Report` | |
| **Author** (literal) | `Associação Brasileira de Normas Técnicas` | Use campo único (autor literal). |
| **Title** | `ABNT NBR 6023: informação e documentação: referências: elaboração` | |
| **Place** | `Rio de Janeiro` | |
| **Institution** | `ABNT` | |
| **Date** | `2018` | |

---

### Página web

**Saída esperada:**
```
UNIVERSIDADE FEDERAL DO CEARÁ. Biblioteca Universitária. Biblioteca
Universitária. Fortaleza: UFC, 2019. Disponível em: http://www.biblioteca.ufc.br.
Acesso em: 18 maio 2019.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Web Page` | |
| **Author** (literal) | `Universidade Federal do Ceará. Biblioteca Universitária` | |
| **Title** | `Biblioteca Universitária` | |
| **Place** | `Fortaleza` | |
| **Website Title** | `UFC` | Aparece como editora/portal. |
| **Date** | `2019` | |
| **URL** | `http://www.biblioteca.ufc.br` | |
| **Accessed** | `2019-05-18` | |

---

### Filme / Vídeo

**Saída esperada:**
```
ALZHEIMER: mudanças na comunicação e no comportamento. Direção: Thereza
Jessouroun. [Rio de Janeiro]: Kino Filmes, 2011. 1 DVD (26 min).
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Film` | |
| **Title** | `Alzheimer: mudanças na comunicação e no comportamento` | Sem autor → CSL coloca em MAIÚSCULAS automaticamente. |
| **Director** | `Jessouroun, Thereza` | |
| **Place** | `[Rio de Janeiro]` | Local inferido entre colchetes. |
| **Studio** | `Kino Filmes` | |
| **Date** | `2011` | |
| **Format** | `1 DVD (26 min)` | Suporte + duração. |

---

### Documento sonoro (CD, faixa)

**Saída esperada (álbum):**
```
BRASILIZAÇÃO. Fortaleza: Estúdio Santa Música, 2006. 1 CD.
```

**Saída esperada (faixa):**
```
ANGÉLICA, Joana. Flor da paisagem. In: ANGÉLICA, Joana. Cantando coisas
de cá. Fortaleza: Radiadora Cultural, 2007. 1 CD, faixa 8.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Audio Recording` | |
| **Performer** | `Angélica, Joana` | (ou vazio para álbum sem intérprete) |
| **Title** | `Flor da paisagem` | Título da faixa. |
| **Album** | `Cantando coisas de cá` | Título do álbum. |
| **Place** | `Fortaleza` | |
| **Label** | `Radiadora Cultural` | Gravadora. |
| **Date** | `2007` | |
| **Format** | `1 CD, faixa 8` | Suporte + detalhes. |

---

### Mapa / Atlas

**Saída esperada:**
```
IBGE. Diretoria de Geodesia e Cartografia. Desigualdade econômica: infância.
Rio de Janeiro, 2010. 1 mapa. Escala 1:30.000.000. Disponível em: https://...
Acesso em: 25 maio 2019.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Map` | |
| **Author** (literal) | `IBGE. Diretoria de Geodesia e Cartografia` | |
| **Title** | `Desigualdade econômica: infância` | |
| **Place** | `Rio de Janeiro` | |
| **Date** | `2010` | |
| **Extra** | `note: 1 mapa. Escala 1:30.000.000` | Aparece após a data. |
| **URL** | `https://atlasescolar.ibge.gov.br/...` | |
| **Accessed** | `2019-05-25` | |

---

### Documento iconográfico

**Saída esperada:**
```
PORTINARI, C. Café. 1935. 1 reprodução, óleo sobre tela, 130 x 195 cm.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Artwork` | |
| **Artist** | `Portinari, C.` | |
| **Title** | `Café` | |
| **Date** | `1935` | |
| **Medium** | `1 reprodução, óleo sobre tela, 130 x 195 cm` | Tipo e dimensões. |

---

### Correspondência

> ⚠️ O CSL não tem suporte nativo para destinatário (`recipient`). Use o campo **Extra** como workaround.

**Saída esperada:**
```
SANTOS, Heitor. [Carta para o filho]. Destinatário: Jefferson Amorim da Silva.
Caucaia, 2019. 1 carta.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Letter` | |
| **Author** | `Santos, Heitor` | |
| **Title** | `[Carta para o filho]` | Entre colchetes quando atribuído. |
| **Date** | `2019` | |
| **Place** | `Caucaia` | |
| **Extra** | `note: Destinatário: Jefferson Amorim da Silva` | Aparece após o título. |
| | `publisher: 1 carta` | Tipo de correspondência. |

---

### Parte de publicação periódica (fascículo)

> ⚠️ O CSL não tem tipo nativo para fascículo isolado. Use **Book** como workaround.

**Saída esperada:**
```
REVISTA BRASILEIRA DE ODONTOLOGIA. Rio de Janeiro: Associação Brasileira
de Odontologia, v. 67, n. 2, jul./dez. 2010.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Book` | |
| **Author** (literal) | `REVISTA BRASILEIRA DE ODONTOLOGIA` | |
| **Title** | *(vazio)* | |
| **Place** | `Rio de Janeiro` | |
| **Publisher** | `Associação Brasileira de Odontologia` | |
| **Volume** | `67` | |
| **Edition** | `2` | Usado como fascículo (`n.`) — mesmo mecanismo do evento em periódico. |
| **Date** | `2010` | |
| **Extra** | `note: jul./dez.` | Intervalo de meses (não suportado nativamente). |

---

### Documento em CD-ROM (parte)

**Saída esperada:**
```
NASCIMENTO, E. Morfologia dos artrópodes. In: CASTRO, I. (org.).
Enciclopédia multimídia dos seres vivos. [s. l.]: Planeta DeAgostini,
c1998. CD-ROM 9.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Book Section` | |
| **Author** | `Nascimento, E.` | |
| **Title** | `Morfologia dos artrópodes` | |
| **Book Author** | `Castro, I.` | Organizador — use campo **container-author** via Extra se necessário. |
| **Book Title** | `Enciclopédia multimídia dos seres vivos` | |
| **Place** | `[s. l.]` | Local desconhecido — coloque literalmente no campo. |
| **Publisher** | `Planeta DeAgostini` | |
| **Date** | `c1998` | Data aproximada com `c` de *circa*. |
| **Volume** | `9` | ⚠️ Número do item na coleção. O CSL gera `CD-ROM 9`. |
| **Extra** | `medium: CD-ROM` | Suporte. Use o campo **Extra** pois o Zotero não tem campo `medium` direto para Book Section. |

---

### Documento em CD-ROM (coleção)

**Saída esperada:**
```
KOOGAN, André; HOUAISS, Antônio (ed.). Enciclopédia e dicionário digital.
São Paulo: Delta, 1998. 5 CD-ROM.
```

| Campo Zotero | Exemplo | Observação |
|---|---|---|
| **Item Type** | `Book` | |
| **Editor** | `Koogan, André; Houaiss, Antônio` | |
| **Title** | `Enciclopédia e dicionário digital` | |
| **Place** | `São Paulo` | |
| **Publisher** | `Delta` | |
| **Date** | `1998` | |
| **# of Volumes** | `5` | ⚠️ Total de volumes. O CSL gera `5 CD-ROM`. |
| **Extra** | `medium: CD-ROM` | Suporte. |

> ⚠️ **`Volume` vs `# of Volumes`:** Use **Volume** para indicar qual item específico da coleção (gera `CD-ROM 9`) e **# of Volumes** para o total de volumes (gera `5 CD-ROM`). Nunca use os dois ao mesmo tempo para o mesmo item.

---

## Limitações conhecidas do CSL

As seguintes situações não têm solução completa no CSL padrão e exigem edição manual ou workarounds:

| Situação | Limitação | Workaround |
|---|---|---|
| **Intervalo de meses** (`jul./dez.`) | CSL só aceita uma data | Digite manualmente na saída final |
| **Autor de nome único** (`BOECHAT:`) | CSL não detecta nomes únicos para trocar `.` por `:` | Inclua `:` diretamente no sobrenome no Zotero |
| **Maiúsculas no local do evento** | `text-case="uppercase"` afeta todo o autor literal | Aceite MAIÚSCULAS ou edite manualmente |
| **Parte de tese/dissertação** | Não existe tipo `chapter-thesis` no CSL | Use `Book Section` com adaptações |
| **Destinatário de carta** | Variável `recipient` não existe no CSL | Use campo `note` via Extra |
| **Fascículo isolado** | Não existe tipo para periódico como todo | Use `Book` com adaptações |
| **Assignee e Country da patente** | Não exportam do Zotero para o CSL | Use `publisher:` e `publisher-place:` no Extra |
| **Título uppercase apenas na 1ª palavra** | CSL não tem `text-case="first-word-uppercase"` | Digite a 1ª palavra em MAIÚSCULAS no campo Title |

---

## Referências normativas

- [Guia de Normalização de Trabalhos Acadêmicos — UFC 2022](https://biblioteca.ufc.br/wp-content/uploads/2022/05/guianormalizacaotrabalhosacademicos-17.05.2022.pdf)
- [Guia de Normalização para Elaboração de Referências — UFC 2023](https://biblioteca.ufc.br/wp-content/uploads/2023/12/guianormalizacaoreferencias.pdf)
- [Guia de Normalização de Citações — UFC 2025](https://biblioteca.ufc.br/wp-content/uploads/2025/06/guianormalizacaocitacoes2025.pdf)
- [ABNT NBR 6023:2018 — Referências](https://www.abnt.org.br/)
- [ABNT NBR 10520:2023 — Citações](https://www.abnt.org.br/)
- [CSL Specification](https://docs.citationstyles.org/en/stable/specification.html)
- [Zotero Rich Text Bibliography](https://www.zotero.org/support/kb/rich_text_bibliography)

---

## Licença

[AGPL-3.0](./LICENSE)
