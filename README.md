# UFC Title Formatter — Plugin para Zotero 8+

[![Zotero 8+](https://img.shields.io/badge/Zotero-8+-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![GitHub release](https://img.shields.io/github/v/release/saviotp/UFC-Zotero-Plugin?style=flat-square)](https://github.com/saviotp/UFC-Zotero-Plugin/releases/latest)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue?style=flat-square)](LICENSE)

Plugin + estilo CSL para formatar referências e citações no **Zotero 8** conforme as normas **ABNT (NBR 6023:2018 / NBR 10520:2023)** interpretadas pelos **Guias de Normalização da UFC** (2022–2025).

---

## Índice

- [O que faz](#o-que-faz)
- [Instalação](#instalação)
- [Preenchimento manual dos campos](#preenchimento-manual-dos-campos)
  - [Livro](#livro)
  - [Capítulo de livro](#capítulo-de-livro)
  - [Tese / Dissertação / TCC](#tese--dissertação--tcc)
  - [Artigo de periódico](#artigo-de-periódico)
  - [Artigo de jornal](#artigo-de-jornal)
  - [Trabalho em evento (anais)](#trabalho-em-evento-anais)
  - [Legislação](#legislação)
  - [Página web / Rede social](#página-web--rede-social)
  - [Filme / Vídeo](#filme--vídeo)
  - [Documento sonoro (CD, faixa)](#documento-sonoro-cd-faixa)
  - [Patente](#patente)
  - [Norma técnica](#norma-técnica)
  - [Mapa / Atlas](#mapa--atlas)
  - [Documento iconográfico](#documento-iconográfico)
  - [Correspondência](#correspondência)
- [Preferências do plugin](#preferências-do-plugin)
- [Referências normativas](#referências-normativas)

---

## O que faz

### Plugin (UFC Title Formatter)

| Funcionalidade                   | Descrição                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Negrito automático no título** | Ao salvar ou importar um item, aplica `<b>` no campo correto conforme ABNT. Obras autônomas (livros, teses, etc.) → negrito no `title`. Partes de obra (artigos, capítulos) → negrito no `publicationTitle`. |
| **Normalização da edição**       | Converte automaticamente o campo `Edition` para número puro (ex: `2a edição` → `2`), garantindo que o CSL gere `2. ed.` conforme ABNT.                                                                       |
| **Sentence case**                | Corrige títulos importados em MAIÚSCULAS para minúsculas (sentence case), preservando siglas (UFC, ABNT, CNPq, etc.).                                                                                        |
| **Menu de contexto**             | Botão direito → _"Formatar título (ABNT/UFC)"_ para formatar manualmente itens selecionados.                                                                                                                 |

### Estilo CSL (ABNT UFC)

Formata referências e citações seguindo rigorosamente os Guias de Normalização da UFC para todos os tipos documentais: livros, artigos, teses, legislação, filmes, patentes, mapas, etc.

---

## Instalação

### Plugin

1. Baixe o arquivo `.xpi` da [última release](https://github.com/saviotp/UFC-Zotero-Plugin/releases/latest).
2. No Zotero: **Ferramentas → Complementos → ⚙ → Instalar complemento a partir de arquivo…**
3. Selecione o `.xpi` baixado e reinicie o Zotero.

### Estilo CSL

1. Baixe o arquivo [`abnt-ufc.csl`](abnt-ufc.csl) deste repositório.
2. No Zotero: **Editar → Preferências → Citar → + (adicionar estilo)**
3. Selecione o `.csl` baixado.

---

## Preenchimento manual dos campos

Quando a extração automática de metadados (via DOI, ISBN ou conector web) não preenche os campos corretamente, siga as tabelas abaixo para cada tipo de documento.

> **Dica:** O campo **Extra** do Zotero pode ser usado para informações adicionais que não têm campo dedicado. O campo **Notas** (`note`) aparece literalmente na referência em alguns tipos.

---

### Livro

**Saída esperada:**

```
MARCONI, Marina de Andrade; LAKATOS, Eva Maria. Metodologia científica.
4. ed. São Paulo: Atlas, 2004.
```

| Campo Zotero   | Exemplo                      | Observação                                          |
| -------------- | ---------------------------- | --------------------------------------------------- |
| **Item Type**  | `Book`                       |                                                     |
| **Author**     | `Marconi, Marina de Andrade` | Sobrenome, Nome. Adicione cada autor separadamente. |
| **Title**      | `Metodologia científica`     | O plugin aplica `<b>` automaticamente.              |
| **Edition**    | `4`                          | Apenas o número. O plugin normaliza automaticamente (ex: `2a edição` → `2`). O CSL gera "4. ed." |
| **Place**      | `São Paulo`                  |                                                     |
| **Publisher**  | `Atlas`                      |                                                     |
| **Date**       | `2004`                       |                                                     |
| **# of Pages** | `305`                        | (Opcional) Gera "305 p."                            |

---

### Capítulo de livro

**Saída esperada:**

```
MULLER, Geraldo. O macroeixo São Paulo-Buenos Aires... In: CASTRO, Iná Elias de;
MIRANDA, Mariana; EGLER, Claudio (org.). Redescobrindo o Brasil: 500 anos depois.
Rio de Janeiro: Bertrand Brasil: FAPERJ, 1999. p. 41-55.
```

| Campo Zotero   | Exemplo                                   | Observação                                  |
| -------------- | ----------------------------------------- | ------------------------------------------- |
| **Item Type**  | `Book Section`                            |                                             |
| **Author**     | `Muller, Geraldo`                         | Autor do capítulo.                          |
| **Title**      | `O macroeixo São Paulo-Buenos Aires...`   | Título do capítulo (sem negrito).           |
| **Editor**     | `Castro, Iná Elias de`                    | ⚠️ Organizador(es) do livro. **Adicione cada um separadamente** (clique em "+" no Zotero). Todos aparecerão na referência. |
| **Book Title** | `Redescobrindo o Brasil: 500 anos depois` | Título do livro (recebe `<b>` via plugin).  |
| **Place**      | `Rio de Janeiro`                          |                                             |
| **Publisher**  | `Bertrand Brasil: FAPERJ`                 | Duas editoras separadas por `: `.           |
| **Date**       | `1999`                                    |                                             |
| **Pages**      | `41-55`                                   |                                             |

> **⚠️ Importante:** Se a referência ABNT mostra vários organizadores (ex: `CASTRO; MIRANDA; EGLER (org.)`), **todos** devem ser cadastrados como "Editor" no Zotero, um por linha. Se apenas um editor for cadastrado, apenas ele aparecerá na referência.

---

### Tese / Dissertação / TCC

**Saída esperada:**

```
LOURENÇO, Ronaldo Mendes. Proposta de modelo físico-socioambiental para o estudo
de bacias hidrográficas semiáridas do nordeste setentrional (Brasil). 2018.
Tese (Doutorado em Geografia) – Centro de Ciências, Universidade Federal do Ceará,
Fortaleza, 2018. Disponível em: http://www.repositorio.ufc.br/handle/riufc/39044.
Acesso em: 13 fev. 2019.
```

| Campo Zotero   | Exemplo                                            | Observação                                       |
| -------------- | -------------------------------------------------- | ------------------------------------------------ |
| **Item Type**  | `Thesis`                                           |                                                  |
| **Author**     | `Lourenço, Ronaldo Mendes`                         |                                                  |
| **Title**      | `Proposta de modelo físico-socioambiental...`      | O plugin aplica `<b>`.                           |
| **Type**       | `Tese (Doutorado em Geografia)`                    | ⚠️ Preencha exatamente como na referência.       |
| **University** | `Universidade Federal do Ceará`                    | Apenas a universidade.                           |
| **Place**      | `Fortaleza`                                        |                                                  |
| **Date**       | `2018`                                             |                                                  |
| **Archive**    | `Centro de Ciências`                               | ⚠️ **Faculdade ou Centro.** Se vazio, é omitido. |
| **# of Pages** | `47`                                               | (Opcional) Gera "47 f." (folhas, conforme ABNT). |
| **URL**        | `http://www.repositorio.ufc.br/handle/riufc/39044` |                                                  |
| **Accessed**   | `2019-02-13`                                       | Data de acesso.                                  |

> **⚠️ Importante:** O campo **Archive** é usado para a faculdade/centro (antes da vírgula que separa da universidade). Se a extração automática colocar tudo junto no campo **University** (ex: "Faculdade X – Universidade Y"), separe manualmente:
>
> - **Archive** → `Faculdade X`
> - **University** → `Universidade Y`

---

### Artigo de periódico

**Saída esperada:**

```
HOFFMANN, C. A autoridade e a questão do pai. Ágora: estudos em teoria
psicanalítica, Rio de Janeiro, v. 9, n. 2, p. 169-176, jul. 2006.
```

| Campo Zotero    | Exemplo                                  | Observação                                   |
| --------------- | ---------------------------------------- | -------------------------------------------- |
| **Item Type**   | `Journal Article`                        |                                              |
| **Author**      | `Hoffmann, C.`                           |                                              |
| **Title**       | `A autoridade e a questão do pai`        | Sem negrito (o plugin aplica no periódico).  |
| **Publication** | `Ágora: estudos em teoria psicanalítica` | Nome do periódico (recebe `<b>` via plugin). |
| **Place**       | `Rio de Janeiro`                         |                                              |
| **Volume**      | `9`                                      |                                              |
| **Issue**       | `2`                                      |                                              |
| **Pages**       | `169-176`                                |                                              |
| **Date**        | `2006-07`                                | Ano-mês. O CSL gera "jul. 2006".             |
| **DOI**         | `10.1590/...`                            | (Se disponível)                              |
| **URL**         | `https://...`                            |                                              |
| **Accessed**    | `2019-02-14`                             |                                              |

---

### Artigo de jornal

**Saída esperada:**

```
BARROS, Luana. STF deve concluir hoje julgamento sobre criminalização da
homofobia. O Povo, Fortaleza, ano 43, n. 30.547, 14 fev. 2019.
Caderno política, p. 11.
```

| Campo Zotero    | Exemplo                                | Observação                     |
| --------------- | -------------------------------------- | ------------------------------ |
| **Item Type**   | `Newspaper Article`                    |                                |
| **Author**      | `Barros, Luana`                        |                                |
| **Title**       | `STF deve concluir hoje julgamento...` |                                |
| **Publication** | `O Povo`                               | Nome do jornal (recebe `<b>`). |
| **Place**       | `Fortaleza`                            |                                |
| **Edition**     | `ano 43`                               | Coloque "ano X" como texto.    |
| **Issue**       | `30.547`                               | Número da edição do jornal.    |
| **Date**        | `2019-02-14`                           | Data completa.                 |
| **Section**     | `Caderno política`                     |                                |
| **Pages**       | `11`                                   |                                |

---

### Trabalho em evento (anais)

**Saída esperada:**

```
DIAS, R. L. Parque Nacional do Pico da Neblina... In: CONGRESSO BRASILEIRO
DE UNIDADES DE CONSERVAÇÃO, 4., 2004, Curitiba. Anais [...]. Curitiba:
Fundação Boticário de Proteção à Natureza, 2004. p. 45-54.
```

| Campo Zotero          | Exemplo                                                               | Observação                               |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| **Item Type**         | `Conference Paper`                                                    |                                          |
| **Author**            | `Dias, R. L.`                                                         |                                          |
| **Title**             | `Parque Nacional do Pico da Neblina...`                               |                                          |
| **Conference Name**   | `CONGRESSO BRASILEIRO DE UNIDADES DE CONSERVAÇÃO, 4., 2004, Curitiba` | ⚠️ Inclua número, ano e local do evento. |
| **Proceedings Title** | `Anais [...]`                                                         |                                          |
| **Place**             | `Curitiba`                                                            |                                          |
| **Publisher**         | `Fundação Boticário de Proteção à Natureza`                           |                                          |
| **Date**              | `2004`                                                                |                                          |
| **Pages**             | `45-54`                                                               |                                          |

---

### Legislação

**Saída esperada:**

```
BRASIL. Lei nº 12.305, de 2 de agosto de 2010. Institui a Política Nacional
de Resíduos Sólidos. Brasília, DF: Casa Civil, 2010. Disponível em: http://...
Acesso em: 13 fev. 2019.
```

| Campo Zotero  | Exemplo                                                                                   | Observação                             |
| ------------- | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| **Item Type** | `Statute`                                                                                 |                                        |
| **Author**    | `Brasil`                                                                                  | Jurisdição como autor (entidade).      |
| **Title**     | `Lei nº 12.305, de 2 de agosto de 2010. Institui a Política Nacional de Resíduos Sólidos` | ⚠️ Inclua epígrafe + ementa no título. |
| **Place**     | `Brasília, DF`                                                                            |                                        |
| **Publisher** | `Casa Civil`                                                                              | Órgão publicador.                      |
| **Date**      | `2010`                                                                                    |                                        |
| **URL**       | `http://www.planalto.gov.br/...`                                                          |                                        |
| **Accessed**  | `2019-02-13`                                                                              |                                        |

---

### Página web / Rede social

**Saída esperada:**

```
UNIVERSIDADE FEDERAL DO CEARÁ. Biblioteca Universitária. Biblioteca Universitária.
Fortaleza: UFC, 2019. Disponível em: http://www.biblioteca.ufc.br.
Acesso em: 18 maio 2019.
```

| Campo Zotero      | Exemplo                                                   | Observação                   |
| ----------------- | --------------------------------------------------------- | ---------------------------- |
| **Item Type**     | `Web Page`                                                |                              |
| **Author**        | `Universidade Federal do Ceará. Biblioteca Universitária` | Entidade como autor.         |
| **Title**         | `Biblioteca Universitária`                                |                              |
| **Place**         | `Fortaleza`                                               |                              |
| **Website Title** | `UFC`                                                     | Aparece como editora/portal. |
| **Date**          | `2019`                                                    |                              |
| **URL**           | `http://www.biblioteca.ufc.br`                            |                              |
| **Accessed**      | `2019-05-18`                                              |                              |

Para **redes sociais**, adicione a rede no campo **Notes**:

| Campo Zotero | Exemplo                      |
| ------------ | ---------------------------- |
| **Author**   | `Couto, Mia`                 |
| **Title**    | `A saudade`                  |
| **Place**    | `Cidade da Beira`            |
| **Date**     | `2019-08-17`                 |
| **Notes**    | `Facebook: @miacoutooficial` |

---

### Filme / Vídeo

**Saída esperada:**

```
ALZHEIMER: mudanças na comunicação e no comportamento. Direção: Thereza
Jessouroun. [Rio de Janeiro]: Kino Filmes, 2011. 1 DVD (26 min).
```

| Campo Zotero  | Exemplo                                                 | Observação                            |
| ------------- | ------------------------------------------------------- | ------------------------------------- |
| **Item Type** | `Film`                                                  |                                       |
| **Title**     | `Alzheimer: mudanças na comunicação e no comportamento` | Sem autor → CSL coloca em MAIÚSCULAS. |
| **Director**  | `Jessouroun, Thereza`                                   |                                       |
| **Place**     | `[Rio de Janeiro]`                                      | ⚠️ Local inferido entre colchetes.    |
| **Studio**    | `Kino Filmes`                                           |                                       |
| **Date**      | `2011`                                                  |                                       |
| **Format**    | `1 DVD (26 min)`                                        | Suporte + duração.                    |

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

| Campo Zotero  | Exemplo                 | Observação                           |
| ------------- | ----------------------- | ------------------------------------ |
| **Item Type** | `Audio Recording`       |                                      |
| **Performer** | `Angélica, Joana`       | (ou vazio para álbum sem intérprete) |
| **Title**     | `Flor da paisagem`      | Título da faixa.                     |
| **Album**     | `Cantando coisas de cá` | Título do álbum (container).         |
| **Place**     | `Fortaleza`             |                                      |
| **Label**     | `Radiadora Cultural`    | Gravadora.                           |
| **Date**      | `2007`                  |                                      |
| **Format**    | `1 CD, faixa 8`         | Suporte + detalhes.                  |

---

### Patente

**Saída esperada:**

```
ARAÚJO, Francisco José Freire de. Processo para o preparo do adubo de caranguejo.
Depositante: Universidade Federal do Ceará. PI0704286-8 A2.
Depósito: 9 nov. 2007. Concessão: 7 jul. 2009. Disponível em: https://...
Acesso em: 27 nov. 2023.
```

| Campo Zotero      | Exemplo                                          | Observação         |
| ----------------- | ------------------------------------------------ | ------------------ |
| **Item Type**     | `Patent`                                         |                    |
| **Inventor**      | `Araújo, Francisco José Freire de`               |                    |
| **Title**         | `Processo para o preparo do adubo de caranguejo` |                    |
| **Assignee**      | `Universidade Federal do Ceará`                  | Depositante.       |
| **Patent Number** | `PI0704286-8 A2`                                 |                    |
| **Filing Date**   | `2007-11-09`                                     | Data de depósito.  |
| **Issue Date**    | `2009-07-07`                                     | Data de concessão. |
| **URL**           | `https://busca.inpi.gov.br/...`                  |                    |
| **Accessed**      | `2023-11-27`                                     |                    |

---

### Norma técnica

**Saída esperada:**

```
ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 6023: informação e
documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018.
```

| Campo Zotero    | Exemplo                                                             | Observação           |
| --------------- | ------------------------------------------------------------------- | -------------------- |
| **Item Type**   | `Report`                                                            |                      |
| **Author**      | `Associação Brasileira de Normas Técnicas`                          | Entidade como autor. |
| **Title**       | `ABNT NBR 6023: informação e documentação: referências: elaboração` |                      |
| **Place**       | `Rio de Janeiro`                                                    |                      |
| **Institution** | `ABNT`                                                              |                      |
| **Date**        | `2018`                                                              |                      |

---

### Mapa / Atlas

**Saída esperada:**

```
IBGE. Diretoria de Geodesia e Cartografia. Desigualdade econômica: infância.
Rio de Janeiro, 2010. 1 mapa. Escala 1:30.000.000. Disponível em: https://...
Acesso em: 25 maio 2019.
```

| Campo Zotero      | Exemplo                                     | Observação              |
| ----------------- | ------------------------------------------- | ----------------------- |
| **Item Type**     | `Map`                                       |                         |
| **Author**        | `IBGE. Diretoria de Geodesia e Cartografia` |                         |
| **Title**         | `Desigualdade econômica: infância`          |                         |
| **Place**         | `Rio de Janeiro`                            |                         |
| **Date**          | `2010`                                      |                         |
| **Extra / Notes** | `1 mapa. Escala 1:30.000.000`               | Coloque no campo Notes. |
| **URL**           | `https://atlasescolar.ibge.gov.br/...`      |                         |
| **Accessed**      | `2019-05-25`                                |                         |

---

### Documento iconográfico

**Saída esperada:**

```
PORTINARI, C. Café. 1935. 1 reprodução, óleo sobre tela, 130 x 195 cm.
```

| Campo Zotero  | Exemplo                                       | Observação        |
| ------------- | --------------------------------------------- | ----------------- |
| **Item Type** | `Artwork`                                     |                   |
| **Artist**    | `Portinari, C.`                               |                   |
| **Title**     | `Café`                                        |                   |
| **Date**      | `1935`                                        |                   |
| **Format**    | `1 reprodução, óleo sobre tela, 130 x 195 cm` | Tipo e dimensões. |

---

### Correspondência

**Saída esperada:**

```
SANTOS, Heitor. [Carta para o filho]. Destinatário: Jefferson Amorim da Silva.
Caucaia, 2019. 1 carta.
```

| Campo Zotero  | Exemplo                     | Observação                        |
| ------------- | --------------------------- | --------------------------------- |
| **Item Type** | `Letter`                    |                                   |
| **Author**    | `Santos, Heitor`            |                                   |
| **Title**     | `[Carta para o filho]`      | Entre colchetes quando atribuído. |
| **Recipient** | `Jefferson Amorim da Silva` |                                   |
| **Place**     | `Caucaia`                   |                                   |
| **Date**      | `2019`                      |                                   |
| **Type**      | `1 carta`                   |                                   |

---

## Preferências do plugin

Acesse em **Zotero → Editar → Preferências → UFC Title Formatter**:

| Preferência                         | Descrição                                                         |
| ----------------------------------- | ----------------------------------------------------------------- |
| **Habilitar formatação automática** | Liga/desliga a aplicação de `<b>` ao salvar/importar itens.       |
| **Corrigir títulos em MAIÚSCULAS**  | Converte títulos all-caps para sentence case, preservando siglas. |

---

## Referências normativas

- [Guia de Normalização de Trabalhos Acadêmicos — UFC 2022](https://biblioteca.ufc.br/wp-content/uploads/2022/05/guianormalizacaotrabalhosacademicos-17.05.2022.pdf)
- [Guia de Normalização para Elaboração de Referências — UFC 2023](https://biblioteca.ufc.br/wp-content/uploads/2023/12/guianormalizacaoreferencias.pdf)
- [Guia de Normalização de Citações — UFC 2025](https://biblioteca.ufc.br/wp-content/uploads/2025/06/guianormalizacaocitacoes2025.pdf)
- [ABNT NBR 6023:2018 — Referências](https://www.abnt.org.br/)
- [ABNT NBR 10520:2023 — Citações](https://www.abnt.org.br/)
- [Zotero Rich Text Bibliography](https://www.zotero.org/support/kb/rich_text_bibliography)

---

## Licença

[AGPL-3.0](LICENSE)
