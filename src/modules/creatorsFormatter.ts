// creatorsFormatter.ts — normalização e utilitários para creators (autores)

// lista de partículas que devem ficar em minúsculas quando em nomes próprios
const PARTICLES = new Set([
  "da",
  "de",
  "do",
  "dos",
  "das",
  "e",
  "van",
  "von",
  "le",
  "la",
  "du",
  "del",
]);

const LOCALE = "pt-BR";

/**
 * Converte uma string para Title Case, preservando partículas (da, de, do, etc.)
 * e tokens que already contain lowercase letters (assume mixed-case intentional).
 */
function toTitleCase(s: string): string {
  if (!s || s.trim().length === 0) return s;
  const capitalize = (tok: string) => {
    const low = tok.toLocaleLowerCase(LOCALE);
    return low.charAt(0).toLocaleUpperCase(LOCALE) + low.slice(1);
  };

  return s
    .split(/\s+/)
    .map((part, idx) => {
      const low = part.toLocaleLowerCase(LOCALE);
      if (idx !== 0 && PARTICLES.has(low)) return low;

      // If the part already contains lowercase letters, assume intentional mixed case
      if (/[a-záàâãéèêíïóôõöúüç]/.test(part)) {
        return part;
      }

      // Handle internal separators like apostrophes and hyphens: capitalize each subtoken
      const sub = part.split(/([-'’])/); // keep separators
      return sub
        .map((st) => {
          if (st === "-" || st === "'" || st === "’") return st;
          return capitalize(st);
        })
        .join("");
    })
    .join(" ");
}

/**
 * Abrevia os prenomes quando houver 3 ou mais nomes (excluindo partículas).
 * Ex: "Isabel Maria Sabino de" -> "I. M. S.";
 */
function abbreviateIfLong(s: string): string {
  if (!s || s.trim().length === 0) return s;
  const toks = s.split(/\s+/).filter((t) => t && t.trim().length > 0);
  const nonParticle = toks.filter((t) => !PARTICLES.has(t.toLocaleLowerCase(LOCALE)));
  if (nonParticle.length < 3) return s;

  const initials = nonParticle
    .map((token) => {
      const subtokens = token.split(/[-'’]/).filter(Boolean);
      const first = subtokens[0].replace(/^[^A-Za-zÀ-ÿ]+/, "").charAt(0);
      return first ? first.toLocaleUpperCase(LOCALE) + "." : "";
    })
    .filter(Boolean);

  return initials.join(" ");
}

/**
 * Verifica se o item possui ao menos um creator (autor, editor, etc.)
 */
export function possuiCreators(item: Zotero.Item): boolean {
  try {
    const creators = item.getCreators();
    return Array.isArray(creators) && creators.length > 0;
  } catch {
    return false;
  }
}

/**
 * Normaliza os sobrenomes (lastName) para MAIÚSCULAS — ABNT NBR 6023:2018.
 * Retorna true se alterou algo.
 */
export function normalizarSobrenomes(item: Zotero.Item): boolean {
  let creators: ReturnType<Zotero.Item["getCreators"]>;
  try {
    creators = item.getCreators();
  } catch {
    return false;
  }

  if (!Array.isArray(creators) || creators.length === 0) return false;

  let changed = false;

  // Load pending translator marks (if any) for this item from addon.data
  let pending: string[] = [];
  try {
    const raw = ((addon && (addon.data as any)) || null) as any;
    if (raw && raw.pendingTranslators && item && (item.id || item.id === 0)) {
      const key = String(item.id);
      pending = Array.isArray(raw.pendingTranslators[key]) ? (raw.pendingTranslators[key] as string[]) : [];
    }
  } catch (e) {
    pending = [];
  }

  const updated = creators.map((creator) => {
    // Heuristic: some imports put the surname at the end of the given-name field
    // e.g. creator.firstName = "José Carlos LIBÂNEO" and creator.lastName = "".
    // If we detect this (last token is ALL UPPERCASE letters), move it to lastName.
    try {
      const rawFirst = (creator.firstName ?? "").toString();
      const rawLast = (creator.lastName ?? "").toString();
      if ((!rawLast || rawLast.trim() === "") && rawFirst && rawFirst.trim().length > 0) {
        const parts = rawFirst.trim().split(/\s+/);
        const candidate = parts[parts.length - 1];
        const letters = candidate.replace(/[^A-Za-zÀ-ÿ]/g, "");
        if (letters.length > 0 && letters === letters.toLocaleUpperCase(LOCALE)) {
          // treat as surname
          const newFirst = parts.slice(0, parts.length - 1).join(" ");
          ztoolkit.log(`[UFC] creatorsFormatter: detected surname-in-firstField: "${rawFirst}" -> first="${newFirst}", last="${candidate}"`);
          creator = { ...creator, firstName: newFirst, lastName: candidate } as any;
        }
      }
    } catch (e) {
      // ignore heuristic errors and continue
    }
    // DEBUG: log runtime creator props to diagnose translator detection
    try {
      const dbg = { firstName: creator.firstName, lastName: creator.lastName, fieldMode: creator.fieldMode } as any;
      const runtimeDbg = creator as any;
      dbg.creatorType = runtimeDbg.creatorType ?? runtimeDbg.role ?? null;
      dbg.creatorTypeID = runtimeDbg.creatorTypeID ?? runtimeDbg.creatorTypeId ?? runtimeDbg.creator_type_id ?? null;
      ztoolkit.log("[UFC] creator DBG:", JSON.stringify(dbg));
    } catch (e) {
      // ignore logging failures
    }

    if (creator.fieldMode === 1) return creator;

    // Detect translator role — Zotero creator objects sometimes use creatorType
    const runtime = creator as any;
    const ctype = (runtime.creatorType || runtime.role || "").toString().toLocaleLowerCase();
    const ctypeID = runtime.creatorTypeID ?? runtime.creatorTypeId ?? runtime.creator_type_id;
    // Conservative translator type ids: keep only 8 (others caused false positives).
    const TRANSLATOR_TYPE_IDS = new Set<number | string>([8]);
    let isTranslator =
      ctype.includes("translator") ||
      ctype.includes("tradutor") ||
      ctype.includes("traduc") ||
      (typeof ctypeID === "number" && TRANSLATOR_TYPE_IDS.has(ctypeID)) ||
      (typeof ctypeID === "string" && TRANSLATOR_TYPE_IDS.has(ctypeID));

    // If the user previously marked this item's surname as translator, respect that (no write yet)
    const lastNormalized = (creator.lastName || "").toString();
    if (!isTranslator && pending && pending.length > 0) {
      // compare normalized forms (case-insensitive, trim)
      const normalizedLast = lastNormalized.normalize("NFC").trim();
      for (const p of pending) {
        if (p && p.normalize("NFC").trim().toLocaleLowerCase(LOCALE) === normalizedLast.toLocaleLowerCase()) {
          // treat as translator for normalization purposes (in-memory)
          ztoolkit.log(`[UFC] normalizarSobrenomes: treating ${lastNormalized} as translator due to pending mark`);
          isTranslator = true;
          break;
        }
      }
    }

    if (isTranslator) {
      try {
        ztoolkit.log(`[UFC] creator classified as translator: first="${creator.firstName}", last="${creator.lastName}", ctype="${ctype}", ctypeID=${String(ctypeID)}`);
      } catch (e) {
        // ignore
      }
    }

    // For translators we apply Title Case (no uppercase surnames) and abbreviate long given names
    if (isTranslator) {
      const newLast = creator.lastName ? toTitleCase(creator.lastName) : creator.lastName;
      let newFirst = creator.firstName ? toTitleCase(creator.firstName) : creator.firstName;
      const maybeAbbr = abbreviateIfLong(newFirst ?? "");
      if (maybeAbbr !== newFirst && maybeAbbr) newFirst = maybeAbbr;

      if (newLast !== creator.lastName || newFirst !== creator.firstName) {
        changed = true;
        ztoolkit.log(`[UFC] normalizarSobrenomes (tradutor): "${creator.lastName}, ${creator.firstName}" → "${newLast}, ${newFirst}"`);
        return { ...creator, lastName: newLast, firstName: newFirst };
      }
      return creator;
    }

    // Default behavior: uppercase surname
    const upper = (creator.lastName ?? "").toLocaleUpperCase(LOCALE);
    // Possibly abbreviate given names if long
    let newFirstName = creator.firstName ?? "";
    const abbr = abbreviateIfLong(newFirstName);
    if (abbr && abbr !== newFirstName) newFirstName = abbr;

    if (upper !== creator.lastName || newFirstName !== (creator.firstName ?? "")) {
      changed = true;
      ztoolkit.log(`[UFC] normalizarSobrenomes: "${creator.lastName}, ${creator.firstName}" → "${upper}, ${newFirstName}"`);
      return { ...creator, lastName: upper, firstName: newFirstName };
    }
    return creator;
  });

  if (changed) {
    item.setCreators(updated);
  }

  return changed;
}

/**
 * Marca como tradutores (creatorType='translator') todos os creators cujo
 * sobrenome está em MAIÚSCULAS e aplica Title Case nesses nomes.
 * Retorna true se o item foi modificado.
 */
export function marcarTradutoresUppercase(item: Zotero.Item): boolean {
  let creators: ReturnType<Zotero.Item["getCreators"]>;
  try {
    creators = item.getCreators();
  } catch {
    return false;
  }

  if (!Array.isArray(creators) || creators.length === 0) return false;

  let changed = false;

  const updated = creators.map((creator) => {
    if (creator.fieldMode === 1) return creator;
    const last = (creator.lastName ?? "").toString();
    if (!last) return creator;
    // Detect uppercase surname (consider accents)
    const letters = last.replace(/[^A-Za-zÀ-ÿ]/g, "");
    if (letters.length === 0) return creator;
    const isAllUpper = letters === letters.toLocaleUpperCase("pt-BR");
    if (!isAllUpper) return creator;

    // Mark as translator and apply Title Case to names
    const runtime = creator as any;
    runtime.creatorType = "translator";
    runtime.creatorTypeID = 8;

    // Reuse existing normalization: create simple Title Case
    const toTitle = (s: string) => {
      if (!s) return s;
      return s
        .split(/\s+/)
        .map((p) => p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1).toLocaleLowerCase("pt-BR"))
        .join(" ");
    };

    const newLast = toTitle(creator.lastName as string);
    const newFirst = toTitle(creator.firstName as string);
    changed = true;
    ztoolkit.log(`[UFC] marcarTradutoresUppercase: marking ${last} as translator -> ${newLast}`);
    return { ...creator, lastName: newLast, firstName: newFirst, creatorType: "translator", creatorTypeID: 8 } as any;
  });

  if (changed) item.setCreators(updated);
  return changed;
}