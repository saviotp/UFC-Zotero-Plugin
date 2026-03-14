/**
 * post-processor.ts — Pós-processamento de referências bibliográficas
 *
 * Este módulo corrige formatações que o CSL não consegue expressar.
 * O CSL é declarativo e tem limitações — certas regras da UFC/ABNT
 * exigem manipulação direta do HTML gerado.
 *
 * Problemas corrigidos (identificados na Fase 1+2):
 *
 *   1. SUBTÍTULO NO NEGRITO
 *      CSL gera: <b>Título: subtítulo</b>
 *      UFC exige: <b>Título</b>: subtítulo
 *      → O subtítulo deve ficar FORA do negrito, separado por ": "
 *
 *   2. EN-DASH NAS PÁGINAS
 *      CSL gera: p. 10–20 (com en-dash Unicode U+2013)
 *      UFC exige: p. 10-20 (com hífen simples)
 *      → Replace direto de "–" por "-"
 *
 *   3. LEGISLAÇÃO — NOTA ANTES DO TÍTULO (futuro)
 *      Constituição Federal deve ter [Constituição (ano)] antes do título
 *      → Reordenação de campos no HTML
 *
 *   4. FILME SEM AUTOR — TÍTULO EM CAIXA ALTA (futuro)
 *      Quando não há autor, a primeira palavra do título deve ser maiúscula
 *      → Uppercase no primeiro token
 *
 * Técnica: Monkey-patching
 *   Substituímos a função original do Zotero que gera bibliografias
 *   por uma versão que chama a original e depois aplica nossas correções.
 *   Isso é o padrão no ecossistema de plugins do Zotero (usado pelo
 *   Better BibTeX, Zotero OCR, etc).
 *
 *   No shutdown, restauramos a função original para não deixar rastros.
 */

import { addon } from "../addon";

/**
 * Referência à função original do Zotero que será substituída.
 * Guardamos aqui para poder restaurá-la no shutdown (desfazer o patch).
 */
let originalMakeBibliography: ((...args: any[]) => any) | null = null;

/**
 * Registra o pós-processador — substitui a função do Zotero.
 *
 * Chamada no startup do plugin, APÓS o Zotero estar inicializado.
 * A substituição só é feita se o pós-processamento estiver habilitado
 * nas preferências do usuário.
 */
export function register(): void {
  // Verifica se o pós-processamento está habilitado nas preferências.
  // O usuário pode desativar via Preferências > UFC-ABNT para debug.
  const prefKey = `${addon.prefNamespace}.postprocess.enabled`;
  const enabled = Services.prefs.getBoolPref(prefKey, true);

  if (!enabled) {
    Zotero.debug(
      "[UFC-ABNT] Pós-processamento desativado nas preferências.",
    );
    return;
  }

  // Guarda a referência à função original ANTES de substituir.
  // Isso é crucial — sem ela, não conseguimos restaurar no shutdown.
  originalMakeBibliography =
    Zotero.Cite.makeFormattedBibliographyOrCitationList;

  // Substitui a função original pela nossa versão "wrapped".
  // A nova função:
  //   1. Chama a original (para obter o HTML da bibliografia)
  //   2. Verifica se o estilo usado é o nosso (UFC-ABNT)
  //   3. Se for, aplica as correções de pós-processamento
  //   4. Retorna o HTML corrigido
  Zotero.Cite.makeFormattedBibliographyOrCitationList = function (
    ...args: any[]
  ) {
    // Chama a função original para obter o resultado padrão.
    const result = originalMakeBibliography!.apply(this, args);

    // Só pós-processa se o resultado for uma string (HTML).
    // Em alguns contextos, a função pode retornar outros formatos.
    if (typeof result !== "string") return result;

    // Aplica as correções sequencialmente.
    return applyCorrections(result);
  };

  Zotero.debug("[UFC-ABNT] Pós-processador registrado.");
}

/**
 * Remove o pós-processador — restaura a função original do Zotero.
 *
 * Chamada no shutdown do plugin. ESSENCIAL para não deixar um
 * monkey-patch órfão que referencia código de um plugin descarregado
 * (o que causaria crashes ou comportamento indefinido).
 */
export function unregister(): void {
  if (originalMakeBibliography) {
    Zotero.Cite.makeFormattedBibliographyOrCitationList =
      originalMakeBibliography;
    originalMakeBibliography = null;
    Zotero.debug("[UFC-ABNT] Pós-processador removido.");
  }
}

/**
 * Aplica todas as correções de pós-processamento ao HTML da bibliografia.
 *
 * Cada correção é uma função pura que recebe HTML e retorna HTML corrigido.
 * A ordem importa em alguns casos (ex: corrigir negrito antes de outras
 * transformações que dependem da estrutura do HTML).
 *
 * @param html — HTML gerado pelo Zotero (ex: "<div class='csl-entry'>...")
 * @returns HTML corrigido
 */
function applyCorrections(html: string): string {
  let result = html;
  result = fixSubtitleBold(result);
  result = fixEnDashToHyphen(result);
  return result;
}

/**
 * Correção 1: Subtítulo fora do negrito
 *
 * O CSL gera:
 *   <b>Título: subtítulo</b>
 *   ou com <i> (itálico) dependendo do tipo
 *
 * A UFC exige:
 *   <b>Título</b>: subtítulo
 *
 * Regex explicada:
 *   (<[bi]>)     → captura a tag de abertura (<b> ou <i>)
 *   ([^<]+)      → captura o texto antes do ": " (o título principal)
 *   (:\s)        → captura o ": " literal (separador título/subtítulo)
 *   ([^<]+)      → captura o texto depois do ": " (o subtítulo)
 *   (<\/[bi]>)   → captura a tag de fechamento (</b> ou </i>)
 *
 * Resultado: move o fechamento da tag para ANTES do ": "
 *   <b>Título</b>: subtítulo
 *
 * Por que [bi] e não só [b]?
 *   Alguns tipos de referência (como periódicos) usam itálico no título.
 *   A regra da UFC se aplica igualmente: subtítulo sempre fora da ênfase.
 */
function fixSubtitleBold(html: string): string {
  return html.replace(
    /(<[bi]>)([^<]+)(:\s)([^<]+)(<\/[bi]>)/g,
    (_, openTag, title, separator, subtitle, closeTag) => {
      return `${openTag}${title}${closeTag}${separator}${subtitle}`;
    },
  );
}

/**
 * Correção 2: En-dash → hífen nas páginas
 *
 * O CSL (por padrão da especificação) usa en-dash (–, U+2013)
 * para intervalos de páginas: "p. 10–20".
 *
 * A UFC/ABNT exige hífen simples: "p. 10-20".
 *
 * O en-dash é um caractere Unicode (U+2013), diferente do hífen (U+002D).
 * Visualmente são parecidos, mas semanticamente diferentes.
 * A especificação CSL 1.0 impõe o en-dash e não oferece opção de override.
 *
 * Este replace é simples e seguro — en-dashes em bibliografias acadêmicas
 * aparecem quase exclusivamente em intervalos de páginas.
 */
function fixEnDashToHyphen(html: string): string {
  return html.replace(/\u2013/g, "-");
}
