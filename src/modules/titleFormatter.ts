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
  "interview", // entrevista avulsa (não publicada em periódico)
  "podcast",
  "preprint",
]);

/**
 * Grupo 2 — O destaque vai no campo `publicationTitle` (container-title).
 * São partes de um todo: artigos, capítulos, trabalhos em evento.
 */
const BOLD_ON_CONTAINER_TYPES: ReadonlySet<string> = new Set([
  "journalArticle", // article-journal no CSL
  "newspaperArticle", // article-newspaper no CSL
  "magazineArticle", // article-magazine no CSL
  "bookSection", // chapter no CSL
  "conferencePaper", // paper-conference no CSL
  "encyclopediaArticle",
  "dictionaryEntry",
]);

/**
 * Tipos que, quando **sem autor**, não recebem negrito algum
 * (Grupo 3 — entrada pelo título em maiúsculas).
 *
 * Na ABNT, quando não há indicação de responsabilidade, a entrada é
 * pelo título em MAIÚSCULAS (a primeira palavra ou até o primeiro
 * sinal de pontuação). Nesse caso, NÃO se aplica destaque tipográfico.
 *
 * Exemplos dos guias UFC:
 *   COLLINS dicionário: inglês-português...
 *   BRASILIZAÇÃO. Fortaleza: Estúdio Santa Música, 2006. 1 CD.
 *   ALZHEIMER: mudanças na comunicação...
 *   TIM MAIA in concert. [Manaus]...
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

// ---------------------------------------------------------------------------
// Verifica se o item possui ao menos um creator (autor, editor, etc.)
// ---------------------------------------------------------------------------

function itemHasCreators(item: Zotero.Item): boolean {
  try {
    const creators = item.getCreators();
    return Array.isArray(creators) && creators.length > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Determina a ação de formatação para um item
// ---------------------------------------------------------------------------

type FormatAction =
  | { action: "bold-title" }
  | { action: "bold-container" }
  | { action: "skip"; reason: string };

/**
 * Decide qual campo deve receber negrito (ou nenhum) com base no
 * tipo de documento e presença de autores.
 */
function determineFormatAction(item: Zotero.Item): FormatAction {
  const itemType = item.itemType as string;

  // Grupo 3 — Sem autor em tipos que requerem autoria para negrito
  if (NO_BOLD_WHEN_NO_AUTHOR_TYPES.has(itemType) && !itemHasCreators(item)) {
    return {
      action: "skip",
      reason: "no-author",
    };
  }

  // Grupo 1 — Negrito no title
  if (BOLD_ON_TITLE_TYPES.has(itemType)) {
    return { action: "bold-title" };
  }

  // Grupo 2 — Negrito no container-title (publicationTitle)
  if (BOLD_ON_CONTAINER_TYPES.has(itemType)) {
    return { action: "bold-container" };
  }

  // Tipo desconhecido → por segurança, não altera
  return {
    action: "skip",
    reason: "unknown-type",
  };
}

// ---------------------------------------------------------------------------
// Formata um item do Zotero (com save)
// ---------------------------------------------------------------------------

export type FormatResult =
  | { changed: true; field: "title" | "publicationTitle" }
  | { changed: false; reason: string };

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

  // Padrão 1: Número seguido de sufixo ordinal + opcional "edição/edition/ed."
  // Ex: "2a edição", "3ª ed.", "2nd edition", "1st ed.", "4th edition"
  //     "2. ed.", "3. edição"
  const numericMatch = trimmed.match(
    /^(\d+)\s*[.ªaº]?\s*(?:st|nd|rd|th)?\s*(?:edi[çc][ãa]o|edition|ed\.?)?$/i,
  );
  if (numericMatch) {
    return numericMatch[1];
  }

  // Padrão 2: Ordinal por extenso + "edição/edition/ed."
  // Ex: "Segunda edição", "Third edition"
  const wordMatch = trimmed.match(
    /^(\p{L}+)\s+(?:edi[çc][ãa]o|edition|ed\.?)$/iu,
  );
  if (wordMatch) {
    const word = wordMatch[1].toLocaleLowerCase("pt-BR");
    const num = ORDINAL_WORDS.get(word);
    if (num) return num;
  }

  // Padrão 3: Apenas ordinal por extenso (sem "edição")
  // Ex: "Segunda", "Third"
  const bareWord = trimmed.toLocaleLowerCase("pt-BR");
  const bareNum = ORDINAL_WORDS.get(bareWord);
  if (bareNum) return bareNum;

  // Padrão 4: Número no início seguido de qualquer coisa
  // Ex: "2nd revised edition", "3e édition"
  const leadingNum = trimmed.match(/^(\d+)\b/);
  if (leadingNum) {
    return leadingNum[1];
  }

  // Não conseguiu extrair → não altera (deixa o texto original)
  return null;
}

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

  const normalized = normalizeEdition(edition);
  if (normalized === null) return false;

  ztoolkit.log(`[UFC] normalizeEdition: "${edition}" → "${normalized}"`);
  item.setField("edition", normalized);
  return true;
}

/**
 * Processa um item individual: normaliza edition + aplica negrito ABNT/UFC.
 * Esta é a função principal chamada pelo Notifier e pelo menu de contexto.
 */
export async function processarItem(item: Zotero.Item): Promise<FormatResult> {
  // Ignorar notas e anexos
  if (item.isNote() || item.isAttachment()) {
    return { changed: false, reason: "note-or-attachment" };
  }

  // Fase 1: Normalizar edition (antes do formatItemTitle para não
  // duplicar o save — se edition mudar, o save virá junto com o título)
  const editionChanged = normalizeEditionField(item);

  // Fase 2: Formatar título (negrito)
  const result = await formatItemTitle(item);

  // Se o título não mudou mas edition sim, precisamos salvar
  if (!result.changed && editionChanged) {
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

  // Etapa 1: Corrigir caixa alta se habilitado
  if (fixUppercase && isUpperCase(value)) {
    value = toSentenceCase(value);
    ztoolkit.log(`[UFC] sentence case: "${value.substring(0, 80)}..."`);
    item.setField(field, value);
    changed = true;
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
  let skippedNoAuthor = 0;
  let skippedOther = 0;

  for (const it of items) {
    const result = await processarItem(it);
    if (result.changed) {
      if (result.field === "title") titleCount++;
      else containerCount++;
    } else {
      if (result.reason === "no-author") skippedNoAuthor++;
      else skippedOther++;
    }
  }

  const total = titleCount + containerCount;

  // Monta mensagem detalhada
  let message: string;
  if (total === 0) {
    message = getString("format-no-changes");
  } else {
    const parts: string[] = [];
    if (titleCount > 0) {
      parts.push(
        getString("format-success-title", {
          args: { count: String(titleCount) },
        }),
      );
    }
    if (containerCount > 0) {
      parts.push(
        getString("format-success-container", {
          args: { count: String(containerCount) },
        }),
      );
    }
    message = parts.join(" ");
  }

  if (skippedNoAuthor > 0) {
    message +=
      " " +
      getString("format-skipped-no-author", {
        args: { count: String(skippedNoAuthor) },
      });
  }

  const pw = new ztoolkit.ProgressWindow(addon.data.config.addonName, {
    closeOnClick: true,
  });
  pw.createLine({
    text: message,
    type: total > 0 ? "success" : "default",
  }).show();
}

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

  ztoolkit.log("[UFC Title Formatter] Menu de contexto registrado.");
}
