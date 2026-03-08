// Publisher formatter: normaliza o campo `publisher` removendo o termo genérico "Editora"
// Ex.: "Cortez Editora" -> "Cortez"

export function normalizePublisherField(item: Zotero.Item): boolean {
  let publisher: string;
  try {
    publisher = item.getField("publisher") as string;
  } catch {
    return false;
  }

  if (!publisher || publisher.trim().length === 0) return false;

  const original = publisher;

  // Remover ocorrências isoladas da palavra 'Editora' (case-insensitive),
  // tanto se estiver no final quanto se for prefixo. Também remove variantes
  // com pontuação adjacente.
  let normalized = publisher.replace(/\beditora\b[.,]?\s*/gi, "");
  normalized = normalized.replace(/\s{2,}/g, " ").trim();

  // Se o resultado ficou vazio (ex: publisher = "Editora"), manter o original
  if (normalized.length === 0) return false;

  if (normalized !== original) {
    try {
      item.setField("publisher", normalized);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
