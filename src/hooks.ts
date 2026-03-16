/**
 * hooks.ts — Funções de ciclo de vida do plugin
 *
 * Este módulo é o "maestro" do plugin. Ele orquestra a inicialização
 * e a limpeza de todos os subsistemas:
 *
 *   startup:
 *     1. Salva metadados do plugin no singleton (addon.data)
 *     2. Inicializa o zotero-plugin-toolkit (helpers de UI, menus, prefs)
 *     3. Instala/atualiza o estilo CSL no Zotero
 *     4. Registra o pós-processador de referências
 *     5. Registra a tela de preferências
 *
 *   shutdown:
 *     1. Remove todos os listeners e hooks registrados
 *     2. Limpa referências para evitar memory leaks
 *
 * Por que separar de addon.ts?
 *   - addon.ts é "dados" (estado puro, sem efeitos colaterais)
 *   - hooks.ts é "ações" (inicializa, limpa, registra)
 *   Essa separação facilita testes e evita dependências circulares.
 */

import { addon } from "./addon";
import type { AddonData } from "./addon";
import { installOrUpdateCSL } from "./modules/csl-manager";
import * as postProcessor from "./modules/post-processor";

/**
 * Chamada pelo bootstrap.js quando o Zotero carrega o plugin.
 *
 * A lógica aqui roda no contexto privilegiado do Gecko, com acesso
 * completo às APIs do Zotero (Zotero.Styles, Zotero.Notifier, etc).
 *
 * Sequência de inicialização:
 *   1. Salvar metadados → addon.data
 *   2. Aguardar Zotero inicializar → Zotero.initializationPromise
 *   3. Instalar/atualizar CSL → csl-manager.installOrUpdateCSL()
 *   4. Registrar pós-processador → postProcessor.register()
 *
 * Cada subsistema é inicializado em seu próprio try/catch para
 * garantir degradação graciosa: se um falhar, os outros continuam.
 */
export async function onStartup(data: AddonData): Promise<void> {
  // 1. Armazena os metadados no singleton para uso em todo o plugin.
  addon.data = data;

  // 2. Aguarda o Zotero estar completamente inicializado.
  //    Zotero.initializationPromise é uma Promise que resolve quando
  //    o banco de dados, estilos e UI estão prontos.
  //    Sem isso, chamadas a Zotero.Styles podem falhar silenciosamente.
  await Zotero.initializationPromise;

  // 3. Instala ou atualiza o estilo CSL.
  //    Precisa vir ANTES do pós-processador porque o monkey-patch
  //    atua sobre a saída de estilos — se o estilo não existir,
  //    o pós-processador não teria o que corrigir.
  try {
    await installOrUpdateCSL();
  } catch (error) {
    Zotero.logError(
      `[UFC-ABNT] Erro ao instalar/atualizar CSL: ${error}`,
    );
  }

  // 4. Registra o pós-processador de referências.
  //    Faz monkey-patch em Zotero.Cite.makeFormattedBibliographyOrCitationList
  //    para interceptar o HTML gerado e aplicar correções UFC.
  try {
    postProcessor.register();
  } catch (error) {
    Zotero.logError(
      `[UFC-ABNT] Erro ao registrar pós-processador: ${error}`,
    );
  }

  Zotero.debug("[UFC-ABNT] Plugin inicializado com sucesso.");
}

/**
 * Chamada pelo bootstrap.js quando o plugin é descarregado.
 *
 * IMPORTANTE: Tudo que foi registrado no startup DEVE ser removido aqui.
 * Se não limparmos, o Zotero pode ter problemas ao atualizar o plugin
 * (listeners duplicados, memória vazando, etc).
 *
 * A ordem de limpeza é a INVERSA da inicialização:
 *   - Primeiro remove o pós-processador (restaura a função original)
 *   - O CSL NÃO é removido no shutdown (só no uninstall), porque
 *     o estilo pode ser útil mesmo sem o plugin ativo
 */
export function onShutdown(data: AddonData): void {
  // Remove o monkey-patch, restaurando a função original do Zotero.
  // Se não fizermos isso, a referência ao código do plugin ficaria
  // "pendurada" (dangling reference) — o Gecko descarrega o módulo
  // do plugin, mas a função patcheada ainda tentaria chamá-lo,
  // causando crashes ou comportamento indefinido.
  postProcessor.unregister();

  Zotero.debug("[UFC-ABNT] Plugin descarregado.");
}
