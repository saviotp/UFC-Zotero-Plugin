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
 * Referência normativa:
 *   Guia de Normalização para Elaboração de Referências — UFC 2023, §2.3d
 */

import { getString } from "../utils/locale";

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
  "film",              // motion_picture no CSL
  "map",
  "artwork",           // graphic no CSL
  "audioRecording",    // song/álbum no CSL
  "statute",           // legislation no CSL
  "patent",
  "webpage",
  "blogPost",          // post-weblog no CSL
  "computerProgram",
  "document",          // tipo genérico — tratar como obra autônoma
  "manuscript",
  "presentation",
  "videoRecording",
  "letter",
  "interview",         // entrevista avulsa (não publicada em periódico)
  "podcast",
  "preprint",
]);

/**
 * Grupo 2 — O destaque vai no campo `publicationTitle` (container-title).
 * São partes de um todo: artigos, capítulos, trabalhos em evento.
 */
const BOLD_ON_CONTAINER_TYPES: ReadonlySet<string> = new Set([
  "journalArticle",       // article-journal no CSL
  "newspaperArticle",     // article-newspaper no CSL
  "magazineArticle",      // article-magazine no CSL
  "bookSection",          // chapter no CSL
  "conferencePaper",      // paper-conference no CSL
  "encyclopediaArticle",
  "dictionaryEntry",
]);

/**
 * Tipos que, quando **sem autor**, não recebem negrito algum
 * (Grupo 3 — entrada pelo título em maiúsculas).
 * Inclui os tipos mais comuns que aparecem sem autoria na ABNT.
 */
const NO_BOLD_WHEN_NO_AUTHOR_TYPES: ReadonlySet<string> = new Set([
  "book",
  "film",
  "newspaperArticle",
  "webpage",
  "audioRecording",
  "artwork",
  "document",
]);

// ---------------------------------------------------------------------------
// Lógica de formatação pura (sem efeitos colaterais)
// ---------------------------------------------------------------------------

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
  if (
    NO_BOLD_WHEN_NO_AUTHOR_TYPES.has(itemType) &&
    !itemHasCreators(item)
  ) {
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

/**
 * Aplica <b> em um campo específico do item e salva.
 */
async function applyBoldToField(
  item: Zotero.Item,
  field: "title" | "publicationTitle",
): Promise<FormatResult> {
  let value: string;
  try {
    value = item.getField(field) as string;
  } catch {
    return { changed: false, reason: `no-field-${field}` };
  }

  const newValue = computeFormattedTitle(value);
  if (newValue === null) {
    return { changed: false, reason: "already-formatted" };
  }

  _isFormatting = true;
  try {
    item.setField(field, newValue);
    await item.saveTx();
  } finally {
    _isFormatting = false;
  }

  return { changed: true, field };
}

// ---------------------------------------------------------------------------
// Formatar itens selecionados (ação manual via menu de contexto)
// ---------------------------------------------------------------------------

/**
 * Formata os itens atualmente selecionados na biblioteca do Zotero.
 * Exibe uma notificação com o resultado, discriminando por campo alterado.
 */
export async function formatSelectedItems(): Promise<void> {
  const zoteroPane =
    Zotero.getActiveZoteroPane && Zotero.getActiveZoteroPane();
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
    const result = await formatItemTitle(it);
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
 */
export function registerTitleFormatterNotifier(): void {
  const callback = {
    notify: async (
      event: string,
      type: string,
      ids: Array<number | string>,
      _extraData: { [key: string]: any },
    ) => {
      if (_isFormatting) return;
      if (!addon?.data.alive) return;
      if (type !== "item") return;
      if (event !== "add" && event !== "modify") return;

      for (const id of ids) {
        try {
          const item = await Zotero.Items.getAsync(id as number);
          if (item) {
            await formatItemTitle(item);
          }
        } catch (e) {
          ztoolkit.log(
            `[UFC Title Formatter] Erro ao formatar item ${id}:`,
            e,
          );
        }
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
    ztoolkit.log(
      "[UFC Title Formatter] Notifier desregistrado:",
      _notifierID,
    );
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
