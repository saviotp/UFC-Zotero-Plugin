# Diagnóstico — Problema de Negrito por Tipo de Referência

## Contexto

O plugin `ufc-title-formatter` atualmente aplica a tag `<b>` de forma
indiscriminada no campo `title` de todos os itens do Zotero, independentemente
do tipo de documento.

Contudo, a norma ABNT e o Guia de Referências da UFC (2023) determinam que
o **elemento a ser destacado varia conforme o tipo de documento**. Em alguns
tipos, o destaque recai sobre o `title` (título da obra). Em outros, recai
sobre o `container-title` (título do periódico, livro-hospedeiro ou evento).
Em outros ainda, não há destaque tipográfico algum.

> **Fonte normativa:**
> Guia de Normalização para Elaboração de Referências — UFC 2023, seção 2.3d:
> *"O recurso tipográfico (negrito, sublinhado ou itálico) utilizado para
> destacar o elemento título deve ser uniforme em todas as referências."*

---

## Regra geral

O destaque tipográfico sempre recai sobre o **título do documento que está
sendo referenciado como um todo** — ou seja, a obra independente, o
veículo de publicação, ou o objeto principal da referência.

Quando o documento referenciado é **parte de outro** (artigo, capítulo,
trabalho em evento), o destaque recai sobre o **título do todo**
(periódico, livro, anais), não sobre a parte.

---

## Mapeamento completo por tipo de documento

### Grupo 1 — Destaque no `title` (título da obra no todo)

Nesses tipos, a obra referenciada é independente e o destaque vai no
próprio título principal.

| Tipo CSL | Tipo de documento | Campo com negrito | Exemplo |
|---|---|---|---|
| `book` | Livro / folheto | `title` | **Metodologia científica** |
| `book` | Dicionário / enciclopédia | `title` | **Dicionário contemporâneo...** |
| `book` | Livro eletrônico / e-book | `title` | **Água e democracia...** |
| `thesis` | Tese / dissertação / TCC | `title` | **Três ensaios em análise econômica** |
| `report` | Relatório / norma técnica | `title` | **ABNT NBR 6023...** |
| `motion_picture` | Filme / vídeo (com autor) | `title` | **Tim Maia in concert** |
| `map` | Documento cartográfico | `title` | **Atlas do Ceará** |
| `graphic` | Documento iconográfico | `title` | **Café** |
| `musical_score` | Partitura | `title` | **A brilhante aurora...** |
| `legislation` | Legislação / ato normativo | `title` | **Lei nº 12.305...** |
| `patent` | Patente | `title` | **Aparelho para servir bebidas...** |
| `webpage` | Website / base de dados | `title` | **Biblioteca Universitária** |
| `post` / `post-weblog` | Rede social / blog | `title` | **A saudade** |
| `song` (álbum no todo) | Documento sonoro (álbum) | `title` | **Brasilização** |

---

### Grupo 2 — Destaque no `container-title` (título do veículo/todo)

Nesses tipos, o documento referenciado é **parte de outro**. O destaque
recai sobre o título da publicação-hospedeira, não sobre o título da parte.

| Tipo CSL | Tipo de documento | Campo com negrito | Exemplo |
|---|---|---|---|
| `article-journal` | Artigo de periódico | `container-title` | **Ágora: estudos em teoria psicanalítica** |
| `article-journal` | Artigo de periódico eletrônico | `container-title` | **Educar em Revista** |
| `article-newspaper` | Artigo de jornal | `container-title` | **O Povo** |
| `chapter` | Capítulo de livro | `container-title` | **Redescobrindo o Brasil...** |
| `paper-conference` (anais) | Trabalho em evento (monografia) | `container-title` | **Anais [...]** |
| `article-journal` (3.4.2.3) | Trabalho em evento (periódico) | `container-title` | **Cadernos do Centro de Pesquisas...** |
| `song` (faixa) | Faixa de álbum | `container-title` | **Cantando coisas de cá** |

---

### Grupo 3 — Sem destaque (entrada pelo título em maiúsculas)

Nesses tipos, não há autor identificado. O próprio título já funciona como
entrada por estar em maiúsculas — não se aplica negrito adicional.

> **Fonte normativa:** Guia UFC 2023, seção 2.3d:
> *"Isto não se aplica às obras sem indicação de autoria ou de
> responsabilidade, cujo elemento de entrada é o próprio título, já
> destacado pelo uso de letras maiúsculas na primeira palavra."*

| Tipo CSL | Exemplo |
|---|---|
| `book` sem `author` | COLLINS dicionário: inglês-português... |
| `motion_picture` sem `author` | ALZHEIMER: mudanças na comunicação... |
| `article-newspaper` sem `author` | BOECHAT: Anac suspende empresa... |

---

### Grupo 4 — Casos especiais

| Tipo CSL | Tipo de documento | Regra |
|---|---|---|
| `book` (Bíblia no todo) | Bíblia | Destaque em `title` — **Bíblia sagrada** |
| `chapter` (Parte de Bíblia) | Parte de Bíblia | Destaque em `container-title` — **Bíblia sagrada** |
| `book` (Psicografia) | Psicografia | Destaque em `title` — **Brasil, coração do mundo...** |
| `article-journal` (Resenha) | Resenha publicada | Destaque em `container-title` — **Margem Esquerda** |
| `article-journal` (Entrevista) | Entrevista publicada | Destaque em `container-title` — **Revista Paranaense...** |

---

## Diagnóstico do comportamento atual do plugin

O `titleFormatter.ts` atual executa a seguinte lógica para **todos** os tipos:

```typescript
// Comportamento atual (incorreto para vários tipos)
if (title.includes(':')) {
  newTitle = `<b>${title.split(':')[0]}</b>:${title.split(':').slice(1).join(':')}`;
} else {
  newTitle = `<b>${title}</b>`;
}
item.setField('title', newTitle);
```

**Problemas identificados:**

1. Aplica `<b>` no `title` de artigos, capítulos e trabalhos em evento —
   tipos nos quais o destaque deveria estar no `container-title`.

2. Aplica `<b>` no `title` de itens sem autor — tipos nos quais não deve
   haver destaque (entrada já está em maiúsculas).

3. Não toca no campo `container-title` em nenhuma situação — logo, artigos
   e capítulos nunca terão o periódico/livro em negrito.

---

## Comportamento esperado após correção

```
// Grupo 1 — Negrito no title
book, thesis, report, motion_picture (com autor), map, graphic,
musical_score, legislation, patent, webpage, post, song (álbum)
→ item.setField('title', formatBold(title))
→ container-title: sem alteração

// Grupo 2 — Negrito no container-title
article-journal, article-newspaper, chapter, paper-conference, song (faixa)
→ title: sem alteração
→ item.setField('..container-title..', formatBold(containerTitle))
   ⚠️ Zotero não expõe container-title via setField() diretamente —
   ver seção "Limitação técnica" abaixo.

// Grupo 3 — Sem negrito
book sem author, motion_picture sem author, article-newspaper sem author
→ Nenhuma alteração
```

---

## Limitação técnica crítica

O Zotero **não permite editar o campo `container-title` via `item.setField()`**
porque esse campo não é armazenado no item filho — ele é derivado do item
pai (livro, periódico) vinculado na biblioteca.

Isso significa que **o plugin não consegue aplicar `<b>` no `container-title`
diretamente**. As alternativas são:

### Alternativa A — Usuário insere `<b>` manualmente no item pai
O usuário abre o periódico/livro no Zotero, vai ao campo `title` do
**item pai** e digita `<b>Nome do Periódico</b>` manualmente.
O Zotero propaga o destaque automaticamente para todos os artigos filhos.

### Alternativa B — Plugin detecta o tipo e alerta o usuário
Em vez de tentar modificar o `container-title`, o plugin exibe uma
notificação no Zotero informando quais itens precisam de ajuste manual:

```typescript
if (['article-journal', 'article-newspaper', 'chapter'].includes(item.itemType)) {
  Zotero.alert(
    window,
    'UFC Title Formatter',
    `O item "${title}" é um artigo/capítulo.\n` +
    `O negrito deve estar no título do periódico/livro.\n` +
    `Edite manualmente o campo título do item pai.`
  );
}
```

### Alternativa C — Plugin cria campo extra no `extra`
Armazena a instrução de formatação no campo `extra` do item, que o
`.csl` pode ler via `note` ou variável customizada para pós-processamento.

### Alternativa D (recomendada para produção) — Macro Word
Após exportar a bibliografia do Zotero para o Word, um macro VBA percorre
todas as referências e aplica negrito no elemento correto por tipo,
usando regex para identificar o padrão estrutural de cada entrada.

---

## Solução imediata recomendada para o plugin

Implementar lógica condicional por `item.itemType` para ao menos:

1. **Não aplicar `<b>` no `title`** de artigos, capítulos e trabalhos em evento
2. **Não aplicar `<b>`** quando não há autor (entrada pelo título em maiúsculas)
3. **Aplicar `<b>` corretamente** nos tipos do Grupo 1

```typescript
const BOLD_ON_TITLE_TYPES = [
  'book', 'thesis', 'report', 'map', 'artwork',
  'audioRecording', 'film', 'statute', 'patent',
  'webpage', 'blogPost', 'computerProgram'
];

const NO_BOLD_TYPES_WHEN_NO_AUTHOR = [
  'book', 'film', 'newspaperArticle'
];

async function formatTitle(item: Zotero.Item): Promise<void> {
  const type = item.itemType;
  const title = item.getField('title') as string;
  const author = item.getCreators();

  // Grupo 3: sem autor → sem negrito
  if (NO_BOLD_TYPES_WHEN_NO_AUTHOR.includes(type) && author.length === 0) {
    return;
  }

  // Grupo 1: negrito no title
  if (BOLD_ON_TITLE_TYPES.includes(type)) {
    if (!title.includes('<b>')) {
      item.setField('title', applyBold(title));
      await item.saveTx();
    }
    return;
  }

  // Grupo 2: negrito no container-title → alertar usuário
  // (container-title não é editável via setField)
  // Implementar notificação ou registrar no log para ajuste manual
}
```

---

## Referências normativas

- Guia de Normalização para Elaboração de Referências — UFC 2023, seção 2.3d
  https://biblioteca.ufc.br/wp-content/uploads/2023/12/guianormalizacaoreferencias.pdf

- Guia de Normalização para Elaboração de Citações — UFC 2025
  https://biblioteca.ufc.br/wp-content/uploads/2025/06/guianormalizacaocitacoes2025.pdf

- Zotero: Rich text formatting in bibliography fields
  https://www.zotero.org/support/kb/rich_text_bibliography

- Zotero: JavaScript API — item.getField / item.setField
  https://www.zotero.org/support/dev/client_coding/javascript_api
