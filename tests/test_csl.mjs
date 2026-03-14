/**
 * Validação do CSL da UFC usando citeproc-js (mesma engine do Zotero).
 *
 * Compara a saída gerada pelo CSL com as referências da folha de respostas
 * (docs/referencias-ufc-exemplos.md).
 *
 * Uso: node tests/test_csl.mjs
 */

import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import CSL from "citeproc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const CSL_PATH = join(PROJECT_ROOT, "ufc.csl");
const LOCALES_DIR = join(PROJECT_ROOT, "node_modules", "citeproc-locales", "locales");

// Carregar o CSL
const cslXml = readFileSync(CSL_PATH, "utf-8");

// Cache de locales
const localeCache = {};
function loadLocale(lang) {
  if (localeCache[lang]) return localeCache[lang];
  const path = join(LOCALES_DIR, `locales-${lang}.xml`);
  if (existsSync(path)) {
    localeCache[lang] = readFileSync(path, "utf-8");
    return localeCache[lang];
  }
  return false;
}

/**
 * Converte HTML inline do citeproc-js para markdown.
 */
function htmlToMarkdown(html) {
  let text = html;
  // citeproc-js usa <i> e <b> para formatação
  text = text.replace(/<b>(.*?)<\/b>/g, "**$1**");
  text = text.replace(/<i>(.*?)<\/i>/g, "*$1*");
  // Remover divs e spans
  text = text.replace(/<\/?div[^>]*>/g, "");
  text = text.replace(/<\/?span[^>]*>/g, "");
  text = text.replace(/<[^>]+>/g, "");
  // Normalizar espaços
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/**
 * Renderiza a bibliografia para um conjunto de itens CSL-JSON.
 */
function renderBibliography(items) {
  // Indexar itens por ID
  const itemsById = {};
  for (const item of items) {
    itemsById[item.id] = item;
  }

  // Sistema de callbacks que o citeproc-js precisa
  const sys = {
    retrieveLocale: (lang) => {
      return loadLocale(lang);
    },
    retrieveItem: (id) => {
      return itemsById[id];
    },
  };

  const engine = new CSL.Engine(sys, cslXml, "pt-BR");

  // Registrar todos os itens
  const ids = items.map((item) => item.id);
  engine.updateItems(ids);

  // Gerar bibliografia
  const [params, entries] = engine.makeBibliography();

  return entries.map((entry) => htmlToMarkdown(entry));
}

// ========================================================================
// FIXTURES — dados CSL-JSON para cada referência de teste
// ========================================================================

const TESTS = [
  // ---- 3.1.1.1 Livros e/ou folhetos no todo ----
  {
    section: "3.1.1.1",
    description: "Livro simples - 1 autor",
    items: [
      {
        id: "lessa2014",
        type: "book",
        title: "Cadê os operários?",
        author: [{ family: "Lessa", given: "Sérgio" }],
        publisher: "Instituto Lukacs",
        "publisher-place": "São Paulo",
        issued: { "date-parts": [[2014]] },
      },
    ],
    expected:
      "LESSA, Sérgio. **Cadê os operários?** São Paulo: Instituto Lukacs, 2014.",
  },
  {
    section: "3.1.1.1",
    description: "Livro - 2 autores com edição",
    items: [
      {
        id: "marconi2004",
        type: "book",
        title: "Metodologia científica",
        author: [
          { family: "Marconi", given: "Marina de Andrade" },
          { family: "Lakatos", given: "Eva Maria" },
        ],
        edition: "4",
        publisher: "Atlas",
        "publisher-place": "São Paulo",
        issued: { "date-parts": [[2004]] },
      },
    ],
    expected:
      "MARCONI, Marina de Andrade; LAKATOS, Eva Maria. **Metodologia científica**. 4. ed. São Paulo: Atlas, 2004.",
  },
  {
    section: "3.1.1.1",
    description: "Livro - 3 autores",
    items: [
      {
        id: "libaneo2012",
        type: "book",
        title: "Educação escolar: políticas, estrutura e organização",
        author: [
          { family: "Libâneo", given: "José Carlos" },
          { family: "Oliveira", given: "João Ferreira de" },
          { family: "Toschi", given: "Mirza Seabra" },
        ],
        publisher: "Cortez",
        "publisher-place": "São Paulo",
        issued: { "date-parts": [[2012]] },
      },
    ],
    expected:
      "LIBÂNEO, José Carlos; OLIVEIRA, João Ferreira de; TOSCHI, Mirza Seabra. **Educação escolar**: políticas, estrutura e organização. São Paulo: Cortez, 2012.",
  },
  {
    section: "3.1.1.1",
    description: "Livro - 4 autores (et al)",
    items: [
      {
        id: "farias2014",
        type: "book",
        title: "Didática e docência",
        author: [
          { family: "Farias", given: "I. M. S." },
          { family: "Sales", given: "J. C. B." },
          { family: "Braga", given: "M. M. S. C." },
          { family: "França", given: "M. do S. L. M." },
        ],
        edition: "4",
        publisher: "Liber Livro",
        "publisher-place": "Brasília, DF",
        issued: { "date-parts": [[2014]] },
      },
    ],
    expected:
      "FARIAS, I. M. S. *et al*. **Didática e docência**. 4. ed. Brasília, DF: Liber Livro, 2014.",
  },
  {
    section: "3.1.1.1",
    description: "Livro - autoria institucional",
    items: [
      {
        id: "ufc2011",
        type: "book",
        title: "Relatório de atividades 2011",
        author: [
          {
            literal:
              "UNIVERSIDADE FEDERAL DO CEARÁ. Biblioteca Universitária",
          },
        ],
        publisher: "Biblioteca Universitária",
        "publisher-place": "Fortaleza",
        issued: { "date-parts": [[2011]] },
      },
    ],
    expected:
      "UNIVERSIDADE FEDERAL DO CEARÁ. Biblioteca Universitária. **Relatório de atividades 2011**. Fortaleza: Biblioteca Universitária, 2011.",
  },
  // ---- 3.1.1.3 Parte de livros ----
  {
    section: "3.1.1.3",
    description: "Capítulo de livro com organizadores",
    items: [
      {
        id: "muller1999",
        type: "chapter",
        title:
          "O macroeixo São Paulo-Buenos Aires e a gestão territorializada de governos subnacionais",
        author: [{ family: "Muller", given: "Geraldo" }],
        editor: [
          { family: "Castro", given: "Iná Elias de" },
          { family: "Miranda", given: "Mariana" },
          { family: "Egler", given: "Claudio" },
        ],
        "container-title": "Redescobrindo o Brasil: 500 anos depois",
        publisher: "Bertrand Brasil: FAPERJ",
        "publisher-place": "Rio de Janeiro",
        page: "41-55",
        issued: { "date-parts": [[1999]] },
      },
    ],
    expected:
      "MULLER, Geraldo. O macroeixo São Paulo-Buenos Aires e a gestão territorializada de governos subnacionais. *In*: CASTRO, Iná Elias de; MIRANDA, Mariana; EGLER, Claudio (org.). **Redescobrindo o Brasil**: 500 anos depois. Rio de Janeiro: Bertrand Brasil: FAPERJ, 1999. p. 41-55.",
  },
  // ---- 3.1.2.1 Trabalhos acadêmicos ----
  {
    section: "3.1.2.1",
    description: "Tese de doutorado",
    items: [
      {
        id: "benegas2006",
        type: "thesis",
        title: "Três ensaios em análise econômica",
        author: [{ family: "Benegas", given: "M." }],
        genre: "Tese (Doutorado em Economia)",
        publisher: "Universidade Federal do Ceará",
        "publisher-place": "Fortaleza",
        issued: { "date-parts": [[2006]] },
        note: "Faculdade de Economia, Administração, Atuária e Contabilidade",
      },
    ],
    expected:
      "BENEGAS, M. **Três ensaios em análise econômica**. 2006. Tese (Doutorado em Economia) – Faculdade de Economia, Administração, Atuária e Contabilidade, Universidade Federal do Ceará, Fortaleza, 2006.",
  },
  // ---- 3.3.7 Artigo de periódico ----
  {
    section: "3.3.7",
    description: "Artigo de periódico - básico",
    items: [
      {
        id: "hoffmann2006",
        type: "article-journal",
        title: "A autoridade e a questão do pai",
        author: [{ family: "Hoffmann", given: "C." }],
        "container-title": "Ágora: estudos em teoria psicanalítica",
        "publisher-place": "Rio de Janeiro",
        volume: "9",
        issue: "2",
        page: "169-176",
        issued: { "date-parts": [[2006, 7]] },
      },
    ],
    expected:
      "HOFFMANN, C. A autoridade e a questão do pai. **Ágora**: estudos em teoria psicanalítica, Rio de Janeiro, v. 9, n. 2, p. 169-176, jul./dez. 2006.",
  },
  // ---- 3.3.9 Artigo de jornal ----
  {
    section: "3.3.9",
    description: "Artigo de jornal",
    items: [
      {
        id: "holanda2019",
        type: "article-newspaper",
        title:
          "Emendas continuam a ser instrumentos de barganha",
        author: [{ family: "Holanda", given: "Carlos" }],
        "container-title": "O Povo",
        "publisher-place": "Fortaleza",
        volume: "92",
        issue: "30.730",
        page: "20",
        issued: { "date-parts": [[2019, 8, 18]] },
      },
    ],
    expected:
      "HOLANDA, Carlos. Emendas continuam a ser instrumentos de barganha. **O Povo**, Fortaleza, ano 92, n. 30.730, p. 20, 18 ago. 2019.",
  },
  // ---- 3.5.1 Patente ----
  {
    section: "3.5.1",
    description: "Patente",
    items: [
      {
        id: "schroeder_patent",
        type: "patent",
        title:
          "Aparelho para servir bebidas e processo para converter um aparelho para servir bebidas",
        author: [
          { family: "Schroeder", given: "Alfred A." },
          { family: "Credle", given: "William S." },
        ],
        publisher: "The Coca-Cola Company",
        "publisher-place": "BR",
        number: "PI 8706898-2 B1",
        submitted: { "date-parts": [[1988, 3, 29]] },
        issued: { "date-parts": [[1991, 10, 29]] },
      },
    ],
    expected:
      "SCHROEDER, Alfred A.; CREDLE, William S. **Aparelho para servir bebidas e processo para converter um aparelho para servir bebidas**. Depositante: The Coca-Cola Company. BR n. PI 8706898-2 B1. Depósito: 29 mar. 1988. Concessão: 29 out. 1991.",
  },
  // ---- 3.6.1 Legislação ----
  // NOTA: Constituição usa type "book". A nota "[Constituição (1988)]" fica
  // após o título no CSL (campo note) mas a UFC quer antes — requer pós-processamento.
  // Subtítulo dentro do negrito também requer pós-processamento.
  {
    section: "3.6.1",
    description: "Constituição (como livro — requer pós-processamento para nota e subtítulo)",
    items: [
      {
        id: "brasil_constituicao",
        type: "book",
        title:
          "Constituição da República Federativa do Brasil: promulgada em 5 de outubro de 1988, atualizada até a Emenda Constitucional nº 39, de 19 de dezembro de 2002",
        author: [{ literal: "BRASIL" }],
        note: "[Constituição (1988)]",
        edition: "31",
        publisher: "Saraiva",
        "publisher-place": "São Paulo",
        issued: { "date-parts": [[2003]] },
      },
    ],
    // Saída atual do CSL (com note após título):
    // BRASIL. **Constituição...nº 39...2002**. [Constituição (1988)]. 31. ed. São Paulo: Saraiva, 2003.
    // Esperado UFC (note antes do título, subtítulo fora do negrito):
    expected:
      "BRASIL. [Constituição (1988)]. **Constituição da República Federativa do Brasil**: promulgada em 5 de outubro de 1988, atualizada até a Emenda Constitucional nº 39, de 19 de dezembro de 2002. 31. ed. São Paulo: Saraiva, 2003.",
  },
  // ---- 3.8.1 Filmes/vídeos ----
  {
    section: "3.8.1",
    description: "Filme com diretor",
    items: [
      {
        id: "alzheimer2011",
        type: "motion_picture",
        title: "Alzheimer: mudanças na comunicação e no comportamento",
        director: [{ family: "Jessouroun", given: "Thereza" }],
        publisher: "Kino Filmes",
        "publisher-place": "[Rio de Janeiro]",
        issued: { "date-parts": [[2011]] },
        medium: "1 DVD (26 min)",
      },
    ],
    expected:
      "ALZHEIMER: mudanças na comunicação e no comportamento. Direção: Thereza Jessouroun. [Rio de Janeiro]: Kino Filmes, 2011. 1 DVD (26 min).",
  },
  // ---- 3.10.1 Documento iconográfico ----
  {
    section: "3.10.1",
    description: "Pintura",
    items: [
      {
        id: "portinari1935",
        type: "graphic",
        title: "Café",
        author: [{ family: "Portinari", given: "C." }],
        issued: { "date-parts": [[1935]] },
        genre: "1 reprodução",
        medium: "óleo sobre tela",
        dimensions: "130 x 195 cm",
      },
    ],
    expected:
      "PORTINARI, C. **Café**. 1935. 1 reprodução, óleo sobre tela, 130 x 195 cm.",
  },
];

// ========================================================================
// Execução dos testes
// ========================================================================

let passed = 0;
let failed = 0;
const errors = [];

for (const test of TESTS) {
  const { section, description, items, expected } = test;
  let result;

  try {
    const results = renderBibliography(items);
    result = results[0] || "(vazio)";
  } catch (e) {
    result = `ERRO: ${e.message}`;
  }

  if (result === expected) {
    console.log(`  ✓ [${section}] ${description}`);
    passed++;
  } else {
    console.log(`  ✗ [${section}] ${description}`);
    console.log(`    Resultado: ${result}`);
    console.log(`    Esperado:  ${expected}`);

    // Mostrar primeira diferença
    const minLen = Math.min(result.length, expected.length);
    let firstDiff = minLen;
    for (let i = 0; i < minLen; i++) {
      if (result[i] !== expected[i]) {
        firstDiff = i;
        break;
      }
    }
    const ctx = 30;
    const start = Math.max(0, firstDiff - ctx);
    console.log(
      `    Diff @${firstDiff}: ...${result.slice(start, firstDiff + ctx)}...`
    );
    console.log(
      `    Diff @${firstDiff}: ...${expected.slice(start, firstDiff + ctx)}...`
    );

    failed++;
    errors.push({ section, description, result, expected });
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log(`Total: ${passed + failed} | Passou: ${passed} | Falhou: ${failed}`);

if (errors.length > 0) {
  console.log(`\nProblemas encontrados:`);
  for (const { section, description } of errors) {
    console.log(`  - [${section}] ${description}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
