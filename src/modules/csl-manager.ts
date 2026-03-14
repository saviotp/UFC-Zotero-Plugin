/**
 * csl-manager.ts — Gerenciador de instalação/atualização do estilo CSL
 *
 * Responsabilidade:
 *   - Na inicialização do plugin, verificar se o estilo UFC-ABNT está
 *     instalado no Zotero
 *   - Se não estiver, instalar automaticamente a partir do CSL embutido
 *   - Se estiver desatualizado, atualizar para a versão embutida no plugin
 *
 * Como funciona a instalação de estilos no Zotero:
 *   O Zotero mantém um diretório de estilos no perfil do usuário
 *   (~/.zotero/zotero/xxxx.default/styles/). Cada estilo é um arquivo
 *   .csl identificado pelo <id> no bloco <info>. A API Zotero.Styles
 *   gerencia esse diretório: instala, remove, lista, e resolve estilos.
 *
 * Fluxo:
 *   1. Ler o arquivo CSL embutido em styles/ufc-abnt.csl (via fetch no rootURI)
 *   2. Verificar se Zotero.Styles.get(cslID) retorna algo
 *   3a. Se não existe → instalar
 *   3b. Se existe → comparar datas <updated> → atualizar se necessário
 */

import { addon } from "../addon";

/**
 * Instala ou atualiza o estilo CSL do plugin no Zotero.
 *
 * Esta função é chamada uma vez durante o startup do plugin
 * (após Zotero.initializationPromise resolver, garantindo que
 * o subsistema de estilos já está pronto).
 */
export async function installOrUpdateCSL(): Promise<void> {
  // 1. Ler o conteúdo do CSL embutido no plugin.
  //
  //    addon.data.rootURI aponta para a raiz do plugin no sistema de
  //    arquivos do Gecko. Por exemplo:
  //      "jar:file:///Users/.../extensions/ufc-zotero-plugin@saviotp/ufc-zotero-plugin.xpi!/"
  //
  //    O fetch() do Gecko consegue resolver URIs jar: (dentro de .xpi),
  //    diferente do fetch() de um navegador comum que só resolve http/https.
  const cslURI = addon.data.rootURI + "styles/ufc-abnt.csl";
  const response = await fetch(cslURI);

  if (!response.ok) {
    Zotero.logError(
      `[UFC-ABNT] Falha ao ler o CSL embutido: ${response.status} ${response.statusText}`,
    );
    return;
  }

  const cslText = await response.text();

  // 2. Verificar se o estilo já está instalado.
  //
  //    Zotero.Styles.get() retorna um objeto Style se encontrar,
  //    ou undefined/null se o estilo não existe.
  const existingStyle = Zotero.Styles.get(addon.cslID);

  if (!existingStyle) {
    // 3a. Estilo não existe — instalar pela primeira vez.
    //
    //     Zotero.Styles.install() recebe:
    //       - cslText: o conteúdo XML completo do CSL
    //       - origin: de onde veio (para o Zotero saber que foi via plugin)
    //       - update: false = instalação nova (true = atualização silenciosa)
    await Zotero.Styles.install(cslText, cslURI, false);
    Zotero.debug("[UFC-ABNT] Estilo CSL instalado com sucesso.");
    return;
  }

  // 3b. Estilo já existe — verificar se precisa atualizar.
  //
  //     Comparamos o campo <updated> do CSL embutido com o do instalado.
  //     O <updated> é um timestamp ISO 8601 (ex: "2026-03-14T00:00:00+00:00").
  //     Se o embutido for mais recente, sobrescrevemos.
  const embeddedDate = extractUpdatedDate(cslText);
  const installedDate = existingStyle.updated
    ? new Date(existingStyle.updated)
    : null;

  if (embeddedDate && (!installedDate || embeddedDate > installedDate)) {
    await Zotero.Styles.install(cslText, cslURI, true);
    Zotero.debug("[UFC-ABNT] Estilo CSL atualizado para versão mais recente.");
  } else {
    Zotero.debug("[UFC-ABNT] Estilo CSL já está na versão atual.");
  }
}

/**
 * Remove o estilo CSL instalado pelo plugin.
 *
 * Chamada durante o uninstall do plugin para limpar.
 * NÃO é chamada no shutdown normal — se o usuário só desativou
 * o plugin, o estilo permanece disponível (comportamento esperado:
 * o estilo pode ser útil mesmo sem o pós-processador).
 */
export function removeCSL(): void {
  const existingStyle = Zotero.Styles.get(addon.cslID);
  if (existingStyle) {
    existingStyle.remove();
    Zotero.debug("[UFC-ABNT] Estilo CSL removido.");
  }
}

/**
 * Extrai a data do campo <updated> do XML do CSL.
 *
 * Usa uma regex simples em vez de um parser XML completo.
 * Motivo: o CSL é um arquivo controlado por nós, o formato do
 * <updated> é previsível e sempre está no bloco <info>.
 * Um parser XML seria overkill para extrair um único campo.
 *
 * @param cslText — Conteúdo XML completo do CSL
 * @returns Date ou null se não encontrar o campo
 */
function extractUpdatedDate(cslText: string): Date | null {
  // Captura o conteúdo entre <updated> e </updated>
  // Exemplo: <updated>2026-03-14T00:00:00+00:00</updated>
  const match = cslText.match(/<updated>([^<]+)<\/updated>/);
  if (!match) return null;
  const date = new Date(match[1]);
  return isNaN(date.getTime()) ? null : date;
}
