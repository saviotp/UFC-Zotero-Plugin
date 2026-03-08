/**
 * UFC Title Formatter
 *
 * Formata títulos de itens do Zotero conforme as normas ABNT (NBR 6023:2018)
 * interpretadas pelo Guia de Normalização da UFC (2023).
 *
 * A regra geral ABNT é: o destaque tipográfico (negrito) recai sobre o
 * **título do documento referenciado como um todo** — ou seja, a obra
 * independente ou o veículo de publicação.
 *
 * Comportamento por grupo:
 *
 *  Grupo 1 — Negrito no `title` (obra autônoma / documento no todo)
 *    book, thesis, report, film, map, artwork, audioRecording,
 *    statute, patent, webpage, blogPost, computerProgram, etc.
 *    → title com subtítulo:  <b>Parte antes do :</b>: subtítulo
 *    → title sem subtítulo:  <b>Título inteiro</b>
 *
 *  Grupo 2 — Negrito no `publicationTitle` (parte de outro documento)
 *    journalArticle, newspaperArticle, bookSection,
 *    conferencePaper, encyclopediaArticle, dictionaryEntry
 *    → title: sem alteração
 *    → publicationTitle: <b>Nome do periódico/livro</b>
 *
 *  Grupo 3 — Sem negrito (entrada pelo título em maiúsculas, sem autor)
 *    Qualquer tipo do Grupo 1 ou 2 sem creator → nenhuma alteração
 *
 * Limitação técnica: em itens do Grupo 2, o campo `publicationTitle`
 * é editável via setField() no Zotero 8 (diferente do container-title
 * do CSL). O plugin aplica <b> diretamente nesse campo.
 *
 * Referências normativas:
 *   - Guia de Normalização de Trabalhos Acadêmicos — UFC 2022
 *     https://biblioteca.ufc.br/wp-content/uploads/2022/05/guianormalizacaotrabalhosacademicos-17.05.2022.pdf
 *   - Guia de Normalização para Elaboração de Referências — UFC 2023
 *     https://biblioteca.ufc.br/wp-content/uploads/2023/12/guianormalizacaoreferencias.pdf
 *   - Guia de Normalização de Citações — UFC 2025
 *     https://biblioteca.ufc.br/wp-content/uploads/2025/06/guianormalizacaocitacoes2025.pdf
 */

import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { normalizePublisherField } from "./publisherFormatter";
import { possuiCreators, normalizarSobrenomes, marcarTradutoresUppercase } from "./creatorsFormatter";
import { mostrarResultado } from "./notifications";

export type FormatResult =
  | { changed: true; field: "title" | "publicationTitle" | "publisher" }
  | { changed: false; reason: string };

// ---------------------------------------------------------------------------
// Flag anti-loop: impede que o observer dispare novamente ao salvar
// ---------------------------------------------------------------------------
let _isFormatting = false;

// ---------------------------------------------------------------------------
// Notifier ID para desregistrar ao desligar o plugin
// ---------------------------------------------------------------------------
let _notifierID: string | undefined;

// ---------------------------------------------------------------------------
// Classificação de tipos de item por grupo de formatação
// ---------------------------------------------------------------------------

/**
 * Grupo 1 — O destaque vai no campo `title` do próprio item.
 * São obras autônomas: livros, teses, relatórios, filmes, mapas, etc.
 * (Usa nomes internos do Zotero, não tipos CSL.)
 */
const BOLD_ON_TITLE_TYPES: ReadonlySet<string> = new Set([
  "book",
  "thesis",
  "report",
  "film", // motion_picture no CSL
  "map",
  "artwork", // graphic no CSL
  "audioRecording", // song/álbum no CSL
  "statute", // legislation no CSL
  "patent",
  "webpage",
  "blogPost", // post-weblog no CSL
  "computerProgram",
  "document", // tipo genérico — tratar como obra autônoma
  "manuscript",
  "presentation",
  "videoRecording",
  "letter",
  "interview",
  "podcast",
  "preprint",
  "case",
  "hearing",
]);

/**
 * Grupo 2 — O destaque vai no campo `publicationTitle` (container-title).
 */
const BOLD_ON_CONTAINER_TYPES: ReadonlySet<string> = new Set([
  "journalArticle",
  "newspaperArticle",
  "magazineArticle",
  "bookSection",
  "conferencePaper",
  "encyclopediaArticle",
  "dictionaryEntry",
]);

/**
 * Tipos que, quando **sem autor**, não recebem negrito algum
 * (Grupo 3 — entrada pelo título em maiúsculas).
 */
const NO_BOLD_WHEN_NO_AUTHOR_TYPES: ReadonlySet<string> = new Set([
  "book",
  "film",
  "newspaperArticle",
  "magazineArticle",
  "webpage",
  "audioRecording",
  "videoRecording",
  "artwork",
  "document",
  "statute",
  "map",
  "encyclopediaArticle",
  "dictionaryEntry",
  "report",
]);

export type FormatAction =
  | { action: "skip"; reason: string }
  | { action: "bold-title" }
  | { action: "bold-container" }
  | { action: "no-action" };

function determineFormatAction(item: Zotero.Item): FormatAction {
  const itemType = item.itemType as string;

  if (NO_BOLD_WHEN_NO_AUTHOR_TYPES.has(itemType) && !possuiCreators(item)) {
    return { action: "skip", reason: "no-author" };
  }

  if (BOLD_ON_TITLE_TYPES.has(itemType)) return { action: "bold-title" };
  if (BOLD_ON_CONTAINER_TYPES.has(itemType)) return { action: "bold-container" };

  return { action: "no-action" };
}

// ---------------------------------------------------------------------------
// Lógica de formatação pura (sem efeitos colaterais)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Conversão de MAIÚSCULAS para sentence case (ABNT)
//
// Abordagem inspirada em zotero-format-metadata (northword) e na API
// nativa Zotero.Utilities.sentenceCase, adaptada para títulos em
// português e normas ABNT/UFC.
//
// Estratégia:
//  1. Identificar posições do texto que devem ser preservadas (tags HTML,
//     siglas entre parênteses, siglas isoladas conhecidas, nocase spans)
//  2. Converter tudo para minúsculas
//  3. Re-capitalizar: primeira letra do texto e início de sub-frases
//  4. Restaurar posições preservadas
//
// Referência: https://github.com/northword/zotero-format-metadata
//             src/modules/rules/correct-title-sentence-case.ts
// ---------------------------------------------------------------------------

/**
 * Detecta se um título está predominantemente em MAIÚSCULAS.
 * Retorna true se mais de 70% das letras são maiúsculas.
 *
 * Remove tags HTML antes da análise para não contar markup.
 */
export function isUpperCase(text: string): boolean {
  const cleaned = text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length === 0) return false;

  const letters = cleaned.replace(
    /[^a-zA-ZáàâãéèêíïóôõöúüçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ]/g,
    "",
  );
  if (letters.length === 0) return false;

  const upperLetters = letters.replace(/[^A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ]/g, "");
  return upperLetters.length / letters.length > 0.7;
}

// Compatibilidade: alias em português
export const estaEmMaiusculas = isUpperCase;

// ---------------------------------------------------------------------------
// Siglas e termos brasileiros que devem ser preservados em MAIÚSCULAS
// ---------------------------------------------------------------------------

/** Siglas de estados brasileiros (UF) */
const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

/** Siglas institucionais, acadêmicas e normativas comuns */
const INSTITUTIONAL_ACRONYMS = [
  // Universidades
  "UFC",
  "UFAM",
  "USP",
  "UNICAMP",
  "UFRJ",
  "UFMG",
  "UFPE",
  "UFRGS",
  "UFBA",
  "UFSC",
  "UFPR",
  "UFF",
  "UFPA",
  "UFSM",
  "UFG",
  "UFES",
  "UFJF",
  "UFAL",
  "UFMA",
  "UFPI",
  "UFRN",
  "UFPB",
  "UFS",
  "UFMS",
  "UFMT",
  "UFT",
  "UFAC",
  "UFRR",
  "UFAP",
  "UNIR",
  "UNIFAP",
  "UNIFESP",
  "UNESP",
  "UERJ",
  "UEL",
  "UEM",
  "UNEB",
  "PUC",
  "PUCRS",
  "PUCSP",
  "PUCMG",
  "PUCPR",
  "PUCCAMP",
  // Órgãos e organismos
  "ABNT",
  "NBR",
  "ISO",
  "IBGE",
  "CNPq",
  "CAPES",
  "INEP",
  "INPA",
  "MEC",
  "SUS",
  "OMS",
  "ONU",
  "UNESCO",
  "OPAS",
  "OIT",
  "IPEA",
  "EMBRAPA",
  "FIOCRUZ",
  "INPE",
  "INPI",
  "ANAC",
  "DNIT",
  "DETRAN",
  // Editoras e fundações acadêmicas
  "EDUEPB",
  "EDUFPE",
  "EDUSP",
  "EDUEL",
  "EDUEM",
  "EDUFBA",
  "EDUFMA",
  "FAPERJ",
  "FAPESP",
  "FUNCAP",
  "FEB",
  // Outros
  "TCC",
  "EAD",
  "ENEM",
  "SINAES",
  "BDTD",
  "DOI",
  "ISBN",
  "ISSN",
  "LGPD",
  "CLT",
  "STF",
  "STJ",
  "TSE",
  "TST",
  "TRF",
  "TRT",
  "IBAMA",
  "FUNAI",
  "ICMBio",
  "INCRA",
  "ANVISA",
  "AIP",
  "DVD",
  "CD",
  "PDF",
  "HTML",
  "URL",
  "HTTP",
  "HTTPS",
  "XML",
  "CSV",
];

/** Todas as siglas combinadas, para lookup rápido */
const ALL_ACRONYMS: ReadonlySet<string> = new Set([
  ...BRAZILIAN_STATES,
  ...INSTITUTIONAL_ACRONYMS,
]);

// ---------------------------------------------------------------------------
// Representação de posições protegidas (preserve ranges)
// ---------------------------------------------------------------------------

interface PreserveRange {
  start: number;
  end: number;
}

// ---------------------------------------------------------------------------
// Função principal de conversão
// ---------------------------------------------------------------------------

/**
 * Converte um título para sentence case, seguindo a estratégia:
 *
 *  1. Coleta posições a preservar (tags HTML, siglas entre parênteses,
 *     palavras que são siglas conhecidas)
 *  2. Se o texto está todo em maiúsculas (allcaps), converte tudo
 *     para minúsculas e depois re-capitaliza o início de cada (sub)frase
 *  3. Se o texto está em Title Case ou misto, aplica a mesma lógica
 *     mas preserva palavras com maiúsculas internas (ex: "iPhone")
 *  4. Restaura as posições preservadas com os valores originais
 *
 * Inspirado em Zotero.Utilities.sentenceCase e northword/zotero-format-metadata.
 *
 * @example
 *   toSentenceCase(
 *     "CONEXÕES ECOSSISTÊMICAS-AMAZÔNICAS: AS TECNOLOGIAS DA COMUNICAÇÃO NA VIDA DOS INDÍGENAS DO ALTO RIO NEGRO (AM)"
 *   )
 *   // → "Conexões ecossistêmicas-amazônicas: as tecnologias da comunicação na vida dos indígenas do alto rio negro (AM)"
 */
export function toSentenceCase(text: string): string {
  if (!text || text.trim().length === 0) return text;

  const preserve: PreserveRange[] = [];
  const locale = "pt-BR";
  const allcaps = text === text.toLocaleUpperCase(locale);

  // --- Passo 1: Coletar posições a preservar ---

  // 1a. Proteger início de sub-frases (após . ? !)
  text.replace(
    /([.?!]\s+)(<[^>]+>)?(\p{Lu})/gu,
    (match, end, markup, char, i) => {
      markup = markup || "";
      // Evitar falso positivo com abreviações (ex: "U.S. Taxes")
      if (!text.substring(0, i + 1).match(/(\p{Lu}\.){2,}$/u)) {
        preserve.push({
          start: i + end.length + markup.length,
          end: i + end.length + markup.length + char.length,
        });
      }
      return match;
    },
  );

  // 1b. Proteger primeira letra do texto (pode ter aspas antes)
  text.replace(
    /^([""''«»]?)(<[^>]+>)?(\p{Lu})/gu,
    (match, prefix, markup, char, offset) => {
      markup = markup || "";
      preserve.push({
        start: offset + prefix.length + markup.length,
        end: offset + prefix.length + markup.length + char.length,
      });
      return match;
    },
  );

  // 1c. Proteger <span class="nocase"> (Zotero rich text)
  text.replace(
    /<span class="nocase">.*?<\/span>|<nc>.*?<\/nc>/gi,
    (match, i) => {
      preserve.push({ start: i, end: i + match.length });
      return match;
    },
  );

  // 1d. Proteger conteúdo dentro de tags de formatação (<i>, <sup>, <sub>, <em>, <strong>)
  // NÃO incluir <b> aqui — o plugin gerencia <b> separadamente (via computeFormattedTitle)
  text.replace(
    /<(i|em|strong|sup|sub)(?:\s[^>]*)?>.*?<\/\1>/gi,
    (match, _tagName, offset) => {
      preserve.push({ start: offset, end: offset + match.length });
      return match;
    },
  );

  // 1e. Proteger siglas entre parênteses: (AM), (DF), (UFC), etc.
  text.replace(
    /\([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ0-9]{1,}\)/g,
    (match, offset) => {
      preserve.push({ start: offset, end: offset + match.length });
      return match;
    },
  );

  // --- Passo 2: Mascarar tags HTML com \uFFFD ---

  let masked = text.replace(/<[^>]+>/g, (match, i) => {
    preserve.push({ start: i, end: i + match.length });
    return "\uFFFD".repeat(match.length);
  });

  // --- Passo 3: Converter palavras para minúsculas ---

  // Tratar "A" isolado após ; ou : (ex: "Subtítulo: A partir de...")
  masked = masked
    .replace(/[;:]\uFFFD*\s+\uFFFD*A\s/g, (match) =>
      match.toLocaleLowerCase(locale),
    )
    .replace(/[–—]\uFFFD*(?:\s+\uFFFD*)?A\s/g, (match) =>
      match.toLocaleLowerCase(locale),
    );

  // Processar cada "palavra" (incluindo palavras compostas com hífen)
  masked = masked.replace(
    /([\u{FFFD}\p{L}\p{N}]+([\u{FFFD}\p{L}\p{N}\p{Pc}]*))|(\s(\p{Lu}+\.){2,})?/gu,
    (word) => {
      const unmasked = word.replace(/\uFFFD/g, "");

      if (unmasked.length === 0) return word;

      // Sigla conhecida → preservar em MAIÚSCULAS (funciona em allcaps e mixed)
      if (ALL_ACRONYMS.has(unmasked.toLocaleUpperCase(locale))) {
        // Restaurar a forma canônica da sigla (ex: "cnpq" → "CNPq")
        const canonical = [...ALL_ACRONYMS].find(
          (a) =>
            a.toLocaleUpperCase(locale) === unmasked.toLocaleUpperCase(locale),
        );
        if (canonical) {
          // Substituir apenas a parte não-mascarada, mantendo \uFFFD
          let result = "";
          let ci = 0;
          for (const ch of word) {
            if (ch === "\uFFFD") {
              result += ch;
            } else {
              result += ci < canonical.length ? canonical[ci] : ch;
              ci++;
            }
          }
          return result;
        }
        return word;
      }

      if (allcaps) {
        return word.toLocaleLowerCase(locale);
      }

      // Letra isolada: só converter "A" → "a"
      if (unmasked.length === 1) {
        return unmasked === "A" ? word.toLocaleLowerCase(locale) : word;
      }

      // Maiúscula interna (ex: "iPhone", "McCartney") → preservar
      if (unmasked.match(/.\p{Lu}/u)) {
        return word;
      }

      // Identificadores alfanuméricos (ex: "H2O") ou siglas genéricas (ex: "XPTO")
      if (
        unmasked.match(/^\p{L}+\p{N}[\p{L}\p{N}]*$/u) ||
        unmasked.match(/^[\p{Lu}\p{N}]+$/u)
      ) {
        return word;
      }

      return word.toLocaleLowerCase(locale);
    },
  );

  // --- Passo 4: Restaurar posições preservadas ---

  // Ordenar de trás para frente para não invalidar offsets
  preserve.sort((a, b) => b.start - a.start);

  for (const { start, end } of preserve) {
    if (start < text.length && end <= text.length) {
      masked =
        masked.substring(0, start) +
        text.substring(start, end) +
        masked.substring(end);
    }
  }

  return masked;
}

// Compatibilidade: alias em português
export const converterParaSentenceCase = toSentenceCase;

/**
 * Dado um título, retorna a versão formatada conforme ABNT/UFC.
 * Retorna `null` se nenhuma alteração for necessária.
 *
 * Regras:
 *  - Se já contém <b>       → não altera
 *  - Com subtítulo (`:`)    → <b>Parte antes do :</b>: subtítulo
 *  - Sem subtítulo          → <b>Título inteiro</b>
 */
export function computeFormattedTitle(title: string): string | null {
  if (!title || title.trim().length === 0) {
    return null;
  }

  // Se já contém tag <b>, não sobrescrever
  if (/<b[\s>]/i.test(title)) {
    return null;
  }

  const colonIndex = title.indexOf(":");
  let newTitle: string;

  if (colonIndex === -1) {
    newTitle = `<b>${title}</b>`;
  } else {
    const mainPart = title.substring(0, colonIndex);
    const rest = title.substring(colonIndex); // inclui o ":"
    newTitle = `<b>${mainPart}</b>${rest}`;
  }

  return newTitle !== title ? newTitle : null;
}

// Compatibilidade: alias em português
export const computarTituloFormatado = computeFormattedTitle;

// ---------------------------------------------------------------------------
// Verifica se o item possui ao menos um creator (autor, editor, etc.)
// ---------------------------------------------------------------------------

// ...existing code...

/**
 * Normaliza o campo `edition` de um item do Zotero, se necessário.
 * Retorna true se o campo foi alterado (sem salvar — o save é feito
 * pelo chamador).
 */
function normalizeEditionField(item: Zotero.Item): boolean {
  let edition: string;
  try {
    edition = item.getField("edition") as string;
  } catch {
    return false;
  }

  if (!edition || edition.trim().length === 0) return false;

  // Tentamos extrair/normalizar com a função utilitária. Ela retorna
  // null quando não há alteração a ser feita (por exemplo: texto livre
  // que não conseguimos mapear). Contudo, mesmo que normalizeEdition
  // retorne null, se o campo for apenas um número (ex: "3") queremos
  // formatá-lo explicitamente aqui para evitar que o CSL gere ordinais
  // com markup (que podem aparecer como '3^o' em alguns previews).
  const normalized = normalizeEdition(edition);
  const isPureNumber = /^\s*\d+\s*$/.test(edition);
  if (normalized === null && !isPureNumber) return false;

  // Detectar idioma do item (campo language). Se disponível e for inglês
  // (startsWith 'en'), escrever a forma ordinal em inglês seguida de ' ed.'
  // Ex: 6 -> '6th ed.'; se for português ou campo vazio, escrever '6. ed.'
  let language = "";
  try {
    language = (item.getField("language") as string) || "";
  } catch {
    language = "";
  }

  const lang = language.toLocaleLowerCase();

  // Determinar o número a partir de `normalized` (pode ser "3" ou "3rd")
  const raw = (normalized ?? edition).toString().trim();
  const leadingNumMatch = raw.match(/^(\d+)/);
  if (!leadingNumMatch) return false;

  const n = parseInt(leadingNumMatch[1], 10);

  // decidir formato: se linguagem é pt/pt-BR ou está vazia (assumimos pt),
  // escrevemos português explícito '3. ed.'; se for inglês, escrevemos
  // '3rd ed.'; outros idiomas seguem o inglês por compatibilidade.
  const usePortuguese = !lang || lang.startsWith("pt");

  if (usePortuguese) {
    const ptEdition = `${n}. ed.`;
    ztoolkit.log(`[UFC] normalizeEdition (lang=${language || "(empty)"}): "${edition}" → "${ptEdition}"`);
    item.setField("edition", ptEdition);
    return true;
  }

  // Caso inglês/outros: montar ordinal em ASCII + ' ed.'
  let suffix = "th";
  const mod100 = n % 100;
  if (mod100 < 11 || mod100 > 13) {
    const mod10 = n % 10;
    if (mod10 === 1) suffix = "st";
    else if (mod10 === 2) suffix = "nd";
    else if (mod10 === 3) suffix = "rd";
  }
  const engEdition = `${n}${suffix} ed.`;
  ztoolkit.log(`[UFC] normalizeEdition (lang=${language}): "${edition}" → "${engEdition}"`);
  item.setField("edition", engEdition);
  return true;
}

/**
 * Decide qual campo deve receber negrito (ou nenhum) com base no
  // Ex: 6 -> '6th ed.'; se for português, escrever '6. ed.' (padrão UFC).
function determineFormatAction(item: Zotero.Item): FormatAction {
  const itemType = item.itemType as string;

  // Grupo 3 — Sem autor em tipos que requerem autoria para negrito
  if (NO_BOLD_WHEN_NO_AUTHOR_TYPES.has(itemType) && !itemHasCreators(item)) {
    return {
      action: "skip",
      reason: "no-author",
    };
  // Determinar o número a partir de `normalized` (pode ser "3" ou "3rd")
  const raw = (normalized ?? edition).toString().trim();
  const leadingNumMatch = raw.match(/^(\d+)/);
  if (!leadingNumMatch) return false; // algo inesperado — não alteramos

  const n = parseInt(leadingNumMatch[1], 10);

  // decidir formato: se linguagem é pt/pt-BR ou está vazia (assumimos pt),
  // escrevemos português explícito '3. ed.'; se for inglês, escrevemos
  // '3rd ed.'; outros idiomas seguem o inglês por compatibilidade.
  const usePortuguese = !lang || lang.startsWith("pt");

  if (usePortuguese) {
    const ptEdition = `${n}. ed.`;
    ztoolkit.log(`[UFC] normalizeEdition (lang=${language || "(empty)"}): "${edition}" → "${ptEdition}"`);
    item.setField("edition", ptEdition);
    return true;
  }

  // Caso inglês/outros: montar ordinal em ASCII + ' ed.'
  let suffix = "th";
  const mod100 = n % 100;
  if (mod100 < 11 || mod100 > 13) {
    const mod10 = n % 10;
    if (mod10 === 1) suffix = "st";
    else if (mod10 === 2) suffix = "nd";
    else if (mod10 === 3) suffix = "rd";
  }
  const engEdition = `${n}${suffix} ed.`;
  ztoolkit.log(`[UFC] normalizeEdition (lang=${language}): "${edition}" → "${engEdition}"`);
  item.setField("edition", engEdition);
  return true;
// Formata um item do Zotero (com save)
// ---------------------------------------------------------------------------

/**
 * Analisa o tipo do item e aplica <b> no campo correto conforme ABNT/UFC.
 */
export async function formatItemTitle(
  item: Zotero.Item,
): Promise<FormatResult> {
  // Ignorar notas e anexos
  if (item.isNote() || item.isAttachment()) {
    return { changed: false, reason: "note-or-attachment" };
  }

  const action = determineFormatAction(item);

  ztoolkit.log(
    `[UFC] formatItemTitle: itemType=${item.itemType as string}, action=${action.action}${action.action === "skip" ? ` (${action.reason})` : ""}`,
  );

  if (action.action === "skip") {
    return { changed: false, reason: action.reason };
  }

  if (action.action === "bold-title") {
    return applyBoldToField(item, "title");
  }

  if (action.action === "bold-container") {
    return applyBoldToField(item, "publicationTitle");
  }

  return { changed: false, reason: "no-action" };
}

// Compatibilidade: alias em português
export const formatarTituloItem = formatItemTitle;

// ---------------------------------------------------------------------------
// Normalização do campo edition para ABNT
// ---------------------------------------------------------------------------

/**
 * Mapa de ordinais escritos por extenso (português e inglês) para número.
 */
const ORDINAL_WORDS: ReadonlyMap<string, string> = new Map([
  // Português
  ["primeira", "1"],
  ["segundo", "2"],
  ["segunda", "2"],
  ["terceira", "3"],
  ["terceiro", "3"],
  ["quarta", "4"],
  ["quarto", "4"],
  ["quinta", "5"],
  ["quinto", "5"],
  ["sexta", "6"],
  ["sexto", "6"],
  ["sétima", "7"],
  ["sétimo", "7"],
  ["oitava", "8"],
  ["oitavo", "8"],
  ["nona", "9"],
  ["nono", "9"],
  ["décima", "10"],
  ["décimo", "10"],
  // Inglês
  ["first", "1"],
  ["second", "2"],
  ["third", "3"],
  ["fourth", "4"],
  ["fifth", "5"],
  ["sixth", "6"],
  ["seventh", "7"],
  ["eighth", "8"],
  ["ninth", "9"],
  ["tenth", "10"],
]);

/**
 * Normaliza o campo `edition` para conter apenas o número.
 *
 * O CSL ABNT-UFC espera um valor numérico puro (ex: `2`) para gerar
 * corretamente `2. ed.`. Porém, importações via ISBN/DOI frequentemente
 * retornam formatos como:
 *   - "2a edição", "3ª ed.", "2. ed."
 *   - "2nd edition", "3rd ed.", "Revised edition"
 *   - "Segunda edição", "Third edition"
 *
 * Esta função extrai o número e retorna apenas ele. Se o valor já for
 * numérico puro ou não puder ser normalizado, retorna null (sem alteração).
 *
 * @returns O número como string se houve normalização, null caso contrário.
 */
export function normalizeEdition(edition: string): string | null {
  if (!edition || edition.trim().length === 0) return null;

  const trimmed = edition.trim();

  // Já é numérico puro → nada a fazer
  if (/^\d+$/.test(trimmed)) return null;

  const hasEnglishIndicators =
    /\b(?:st|nd|rd|th)\b/i.test(trimmed) || /\bedition\b/i.test(trimmed);

  const ordinalSuffix = (n: number) => {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return "th";
    const mod10 = n % 10;
    if (mod10 === 1) return "st";
    if (mod10 === 2) return "nd";
    if (mod10 === 3) return "rd";
    return "th";
  };

  // Padrão 1: Número seguido de sufixo ordinal + opcional "edição/edition/ed."
  // Ex: "2a edição", "3ª ed.", "2nd edition", "1st ed.", "4th edition"
  //     "2. ed.", "3. edição"
  const numericMatch = trimmed.match(
    /^(\d+)\s*[.ªaº]?\s*(?:st|nd|rd|th)?\s*(?:edi[çc][ãa]o|edition|ed\.?)?$/i,
  );
  if (numericMatch) {
    const n = numericMatch[1];
    if (hasEnglishIndicators) {
      const num = parseInt(n, 10);
      return `${num}${ordinalSuffix(num)}`;
    }
    return n;
  }

  // Padrão 2: Ordinal por extenso + "edição/edition/ed."
  // Ex: "Segunda edição", "Third edition"
  const wordMatch = trimmed.match(
    /^(\p{L}+)\s+(?:edi[çc][ãa]o|edition|ed\.?)$/iu,
  );
  if (wordMatch) {
    const word = wordMatch[1].toLocaleLowerCase("pt-BR");
    const num = ORDINAL_WORDS.get(word);
    if (num) {
      if (hasEnglishIndicators) {
        const n = parseInt(num, 10);
        return `${n}${ordinalSuffix(n)}`;
      }
      return num;
    }
  }

  // Padrão 3: Apenas ordinal por extenso (sem "edição")
  // Ex: "Segunda", "Third"
  const bareWord = trimmed.toLocaleLowerCase("pt-BR");
  const bareNum = ORDINAL_WORDS.get(bareWord);
  if (bareNum) {
    if (hasEnglishIndicators) {
      const n = parseInt(bareNum, 10);
      return `${n}${ordinalSuffix(n)}`;
    }
    return bareNum;
  }

  // Padrão 4: Número no início seguido de qualquer coisa
  // Ex: "2nd revised edition", "3e édition"
  const leadingNum = trimmed.match(/^(\d+)\b/);
  if (leadingNum) {
    const n = leadingNum[1];
    if (hasEnglishIndicators) {
      const num = parseInt(n, 10);
      return `${num}${ordinalSuffix(num)}`;
    }
    return n;
  }

  // Não conseguiu extrair → não altera (deixa o texto original)
  return null;
}

// Compatibilidade: alias em português
export const normalizarEdicao = normalizeEdition;

// (A implementação de normalizeEditionField está acima — mantida)

// ---------------------------------------------------------------------------
// Normalização de sobrenomes para MAIÚSCULAS (ABNT NBR 6023:2018)
// ---------------------------------------------------------------------------

/**
 * Normaliza os sobrenomes (lastName) de todos os creators do item
 * para MAIÚSCULAS, conforme exige a ABNT NBR 6023:2018.
 *
 * Regras:
 *  - fieldMode === 0 (two-field, pessoa física): lastName → MAIÚSCULAS
 *  - fieldMode === 1 (single-field, literal/institucional): não altera
 *    (o usuário controla manualmente o que fica em maiúsculas no literal)
 *
 * Retorna true se ao menos um creator foi alterado (sem salvar —
 * o save é responsabilidade do chamador).
 */
// creators normalization moved to src/modules/creatorsFormatter.ts

/**
 * Processa um item individual: normaliza sobrenomes + edition + aplica negrito ABNT/UFC.
 * Esta é a função principal chamada pelo Notifier e pelo menu de contexto.
 */
export async function processarItem(item: Zotero.Item): Promise<FormatResult> {
  // Ignorar notas e anexos
  if (item.isNote() || item.isAttachment()) {
    return { changed: false, reason: "note-or-attachment" };
  }

  // Fase 1: Normalizar sobrenomes para MAIÚSCULAS (ABNT NBR 6023:2018)
  const creatorsChanged = normalizarSobrenomes(item);

  // Se alteramos creators (por ex. tradutores convertidos), salvar imediatamente
  // para garantir que a normalização seja persistida antes de outras etapas.
  if (creatorsChanged) {
    _isFormatting = true;
    try {
      ztoolkit.log("[UFC] processarItem: creatorsChanged=true — salvando imediatamente");
      await item.saveTx();
    } finally {
      _isFormatting = false;
    }
  }

  // Fase 2: Normalizar edition
  const editionChanged = normalizeEditionField(item);

  // Fase 2.5: Normalizar editora (remover palavra genérica 'Editora')
  const publisherChanged = normalizePublisherField(item);

  // Fase 3: Formatar título (negrito)
  const result = await formatItemTitle(item);

  // Se o título não mudou mas creators ou edition sim, precisamos salvar
  if (!result.changed && (creatorsChanged || editionChanged)) {
    _isFormatting = true;
    try {
      await item.saveTx();
    } finally {
      _isFormatting = false;
    }
    return { changed: true, field: "title" };
  }

  return result;
}

/**
 * Aplica <b> em um campo específico do item e salva.
 * Se a preferência `fixUppercase` estiver habilitada e o texto estiver
 * predominantemente em MAIÚSCULAS, converte para sentence case antes.
 */
async function applyBoldToField(
  item: Zotero.Item,
  field: "title" | "publicationTitle",
): Promise<FormatResult> {
  let value: string;
  try {
    value = item.getField(field) as string;
  } catch {
    ztoolkit.log(`[UFC] applyBoldToField: campo ${field} não existe`);
    return { changed: false, reason: `no-field-${field}` };
  }

  if (!value || value.trim().length === 0) {
    ztoolkit.log(`[UFC] applyBoldToField: campo ${field} vazio`);
    return { changed: false, reason: `empty-field-${field}` };
  }

  ztoolkit.log(
    `[UFC] applyBoldToField: field=${field}, value="${value.substring(0, 80)}..."`,
  );

  let changed = false;

  // Etapa 0: Se já contém <b> mas o texto está em MAIÚSCULAS,
  // remover as tags <b> existentes para permitir re-processamento.
  // Isso permite corrigir itens formatados antes do sentence case existir.
  const fixUppercase = getPref("fixUppercase");
  const upper = isUpperCase(value);
  ztoolkit.log(
    `[UFC] fixUppercase=${String(fixUppercase)}, isUpperCase=${String(upper)}`,
  );

  if (fixUppercase && upper && /<b[\s>]/i.test(value)) {
    ztoolkit.log(`[UFC] Removendo <b> existente para re-processar`);
    value = value.replace(/<\/?b>/gi, "");
  }

  // Etapa 1: Normalizar títulos de obras para sentence case (sempre)
  // Conforme solicitado: títulos das obras (Grupo 1) devem ficar com
  // apenas a primeira letra maiúscula. Usamos toSentenceCase, que
  // preserva siglas e marcas internas.
  try {
    const itemType = item.itemType as string;
    if (field === "title" && BOLD_ON_TITLE_TYPES.has(itemType)) {
      const sentence = toSentenceCase(value);
      if (sentence !== value) {
        value = sentence;
        ztoolkit.log(
          `[UFC] normalized title to sentence case: "${value.substring(0, 80)}..."`,
        );
        item.setField(field, value);
        changed = true;
      }
    } else if (fixUppercase && isUpperCase(value)) {
      // fallback: preservamos comportamento anterior para outros campos
      value = toSentenceCase(value);
      ztoolkit.log(`[UFC] sentence case: "${value.substring(0, 80)}..."`);
      item.setField(field, value);
      changed = true;
    }
  } catch (e) {
    // Segurança: não bloquear formatação se item.itemType for inacessível
    ztoolkit.log(`[UFC] erro ao tentar normalizar título:`, e);
  }

  // Etapa 2: Aplicar negrito
  const newValue = computeFormattedTitle(value);
  ztoolkit.log(
    `[UFC] computeFormattedTitle: ${newValue !== null ? `"${newValue.substring(0, 80)}..."` : "null (sem alteração)"}`,
  );

  if (newValue !== null) {
    item.setField(field, newValue);
    changed = true;
  }

  if (changed) {
    ztoolkit.log(`[UFC] Salvando item...`);
    await item.saveTx();
    return { changed: true, field };
  }

  ztoolkit.log(`[UFC] Nenhuma alteração necessária`);
  return { changed: false, reason: "already-formatted" };
}

// Compatibilidade: wrapper em português (reexport)
export async function aplicarNegritoNoCampo(
  item: Zotero.Item,
  field: "title" | "publicationTitle",
): Promise<FormatResult> {
  return applyBoldToField(item, field);
}

// ---------------------------------------------------------------------------
// Formatar itens selecionados (ação manual via menu de contexto)
// ---------------------------------------------------------------------------

/**
 * Formata os itens atualmente selecionados na biblioteca do Zotero.
 * Exibe uma notificação com o resultado, discriminando por campo alterado.
 */
export async function formatSelectedItems(): Promise<void> {
  const zoteroPane = Zotero.getActiveZoteroPane && Zotero.getActiveZoteroPane();
  if (!zoteroPane) {
    return;
  }

  const items = zoteroPane.getSelectedItems() as Zotero.Item[];
  if (!items || items.length === 0) {
    new ztoolkit.ProgressWindow(addon.data.config.addonName, {
      closeOnClick: true,
    })
      .createLine({
        text: getString("format-no-items"),
        type: "default",
      })
      .show();
    return;
  }

  let titleCount = 0;
  let containerCount = 0;
  let publisherCount = 0;
  let skippedNoAuthor = 0;
  let skippedOther = 0;

  for (const it of items) {
    const result = await processarItem(it);
    if (result.changed) {
      if (result.field === "title") titleCount++;
      else if (result.field === "publisher") publisherCount++;
      else containerCount++;
    } else {
      if (result.reason === "no-author") skippedNoAuthor++;
      else skippedOther++;
    }
  }

  const total = titleCount + containerCount + publisherCount;

  mostrarResultado({
    title: titleCount,
    container: containerCount,
    publisher: publisherCount,
    creators: 0,
    edition: 0,
    skipped: skippedNoAuthor,
  });
}

// Compatibilidade: alias em português
export const formatarItensSelecionados = formatSelectedItems;

// ---------------------------------------------------------------------------
// Registrar Notifier (observer de eventos de item)
// ---------------------------------------------------------------------------

/**
 * Registra o observer no Zotero.Notifier para escutar eventos
 * `add` e `modify` em itens. Deve ser chamado durante o startup.
 *
 * Usa padrão try/finally no batch inteiro para garantir que a flag
 * anti-loop é resetada mesmo se ocorrer erro em um item.
 */
export function registerTitleFormatterNotifier(): void {
  const callback = {
    notify: async (
      event: string,
      type: string,
      ids: Array<number | string>,
      _extraData: { [key: string]: any },
    ) => {
      if (_isFormatting) {
        ztoolkit.log(`[UFC] Notifier: ignorando (já está formatando)`);
        return;
      }
      if (!addon?.data.alive) {
        ztoolkit.log(`[UFC] Notifier: ignorando (addon não está ativo)`);
        return;
      }
      if (type !== "item") return;
      if (event !== "add" && event !== "modify") return;

      // Verificar se a formatação automática está habilitada
      const enabled = getPref("enable");
      if (!enabled) {
        ztoolkit.log(
          `[UFC] Notifier: ignorando (formatação automática desabilitada)`,
        );
        return;
      }

      ztoolkit.log(
        `[UFC] Notifier: event=${event}, type=${type}, ids=[${ids.join(",")}]`,
      );

      _isFormatting = true;
      try {
        for (const id of ids) {
          try {
            const item = await Zotero.Items.getAsync(id as number);
            if (item) {
              await processarItem(item);
            }
          } catch (e) {
            ztoolkit.log(
              `[UFC Title Formatter] Erro ao formatar item ${id}:`,
              e,
            );
          }
        }
      } finally {
        _isFormatting = false;
      }
    },
  };

  _notifierID = Zotero.Notifier.registerObserver(
    callback,
    ["item"],
    "ufc-title-formatter",
  );

  ztoolkit.log("[UFC Title Formatter] Notifier registrado:", _notifierID);
}

// ---------------------------------------------------------------------------
// Desregistrar Notifier
// ---------------------------------------------------------------------------

export function unregisterTitleFormatterNotifier(): void {
  if (_notifierID) {
    Zotero.Notifier.unregisterObserver(_notifierID);
    ztoolkit.log("[UFC Title Formatter] Notifier desregistrado:", _notifierID);
    _notifierID = undefined;
  }
}

// ---------------------------------------------------------------------------
// Registrar item de menu de contexto (botão direito)
// ---------------------------------------------------------------------------

export function registerContextMenu(): void {
  const menuIcon = `chrome://${addon.data.config.addonRef}/content/icons/favicon@0.5x.png`;

  ztoolkit.Menu.register("item", {
    tag: "menuitem",
    id: "zotero-itemmenu-ufc-format-title",
    label: getString("menuitem-format-title"),
    commandListener: () => formatSelectedItems(),
    icon: menuIcon,
  });

  // Note: marking/persisting translators is integrated into the main "Format Title" action.
  // We still provide a separate action to "Selecionar Tradutores" so users can mark candidates
  // without running the full format flow immediately.
  ztoolkit.Menu.register("item", {
    tag: "menuitem",
    id: "zotero-itemmenu-ufc-mark-translators",
    label: "Selecionar tradutores (selecionados)",
    commandListener: () => marcarTradutoresSelecionados(),
    icon: menuIcon,
  });

  ztoolkit.log("[UFC Title Formatter] Menu de contexto registrado.");
}

/**
 * Marca tradutores para os itens selecionados (procura sobrenomes em MAIÚSCULAS).
 */
export async function marcarTradutoresSelecionados(): Promise<void> {
  const zoteroPane = Zotero.getActiveZoteroPane && Zotero.getActiveZoteroPane();
  if (!zoteroPane) return;

  const items = zoteroPane.getSelectedItems() as Zotero.Item[];
  if (!items || items.length === 0) return;
  // Collect candidate uppercase surnames from the first selected item
  const firstCreators = (items[0].getCreators() || []) as Array<any>;
  const uppercaseSurnames = Array.from(
    new Set(
      firstCreators
        .map((c) => (c.lastName || "").toString())
        .filter((ln) => ln && ln.replace(/[^A-Za-zÀ-ÿ]/g, "") === ln && ln === ln.toLocaleUpperCase("pt-BR")),
    ),
  );

  if (uppercaseSurnames.length === 0) {
    // Nothing obvious to mark
    new ztoolkit.ProgressWindow(addon.data.config.addonName, { closeOnClick: true })
      .createLine({ text: getString("format-no-items"), type: "default" })
      .show();
    return;
  }

  // Ask user which surnames to mark (comma-separated); default to all candidates
  const defaultInput = uppercaseSurnames.join(", ");
  const mainWin = Zotero.getMainWindows && Zotero.getMainWindows()[0];
  const userInput = mainWin && (mainWin as any).prompt
    ? (mainWin as any).prompt(`Marcar quais tradutores? (vírgula-separados)\nEx.: ${defaultInput}`, defaultInput)
    : defaultInput;

  if (!userInput) return;

  const toMark = (userInput as string)
    .split(/\s*,\s*/)
    .map(function (s: string) {
      return s.trim();
    })
    .filter(Boolean);

  // Store pending marks per-item in addon.data.pendingTranslators
  let markedItems = 0;
  try {
    if (!addon.data) (addon as any).data = {};
    if (!((addon.data as any).pendingTranslators)) (addon.data as any).pendingTranslators = {};
    const root = (addon.data as any).pendingTranslators;

    for (const it of items) {
      try {
        const key = String(it.id);
        root[key] = toMark.slice();
        markedItems++;
        // Preview normalization by calling processarItem (which will consult pending marks)
        try {
          await processarItem(it);
        } catch (e) {
          // preview failure shouldn't block storing marks
          ztoolkit.log("[UFC] marcarTradutoresSelecionados: preview failed", e);
        }
      } catch (e) {
        ztoolkit.log("[UFC] marcarTradutoresSelecionados: erro ao armazenar marca", e);
      }
    }
  } catch (e) {
    ztoolkit.log("[UFC] marcarTradutoresSelecionados: erro ao inicializar pendingTranslators", e);
  }

  mostrarResultado({ title: 0, container: 0, publisher: 0, creators: markedItems, edition: 0, skipped: 0 });
}

/**
 * Persiste as marcas de tradutores pendentes para os itens selecionados.
 * Para cada item selecionado, converte as marcas em creatorType='translator'
 * e salva o item. Remove a marca pendente após salvar.
 */
// persistirMarcasTradutoresSelecionados removed — persistence is now integrated into formatSelectedItems

// Compatibilidade: aliases com nomes em português para uso interno
export const registrarNotificadorFormatador = registerTitleFormatterNotifier;
export const desregistrarNotificadorFormatador = unregisterTitleFormatterNotifier;
export const registrarMenuDeContexto = registerContextMenu;
