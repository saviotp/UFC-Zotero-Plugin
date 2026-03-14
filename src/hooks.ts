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

/**
 * Chamada pelo bootstrap.js quando o Zotero carrega o plugin.
 *
 * A lógica aqui roda no contexto privilegiado do Gecko, com acesso
 * completo às APIs do Zotero (Zotero.Styles, Zotero.Notifier, etc).
 */
export async function onStartup(data: AddonData): Promise<void> {
  // 1. Armazena os metadados no singleton para uso em todo o plugin.
  addon.data = data;

  // 2. Aguarda o Zotero estar completamente inicializado.
  //    Zotero.initializationPromise é uma Promise que resolve quando
  //    o banco de dados, estilos e UI estão prontos.
  //    Sem isso, chamadas a Zotero.Styles podem falhar silenciosamente.
  await Zotero.initializationPromise;

  // 3-5. Os módulos csl-manager, post-processor e preferences
  //       serão chamados aqui na Fase 4.
  //       Por enquanto, registramos apenas uma mensagem de debug.
  Zotero.debug("[UFC-ABNT] Plugin inicializado com sucesso.");
}

/**
 * Chamada pelo bootstrap.js quando o plugin é descarregado.
 *
 * IMPORTANTE: Tudo que foi registrado no startup DEVE ser removido aqui.
 * Se não limparmos, o Zotero pode ter problemas ao atualizar o plugin
 * (listeners duplicados, memória vazando, etc).
 */
export function onShutdown(data: AddonData): void {
  Zotero.debug("[UFC-ABNT] Plugin descarregado.");

  // Limpeza dos módulos será adicionada na Fase 4.
}
