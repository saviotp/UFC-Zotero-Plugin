/**
 * index.ts — Entry point do plugin (fachada para o bootstrap.js)
 *
 * Este módulo é importado pelo bootstrap.js via ChromeUtils.importESModule().
 * Ele exporta um objeto default com dois métodos — startup() e shutdown() —
 * que o bootstrap chama nos momentos corretos do ciclo de vida.
 *
 * A responsabilidade deste arquivo é mínima:
 *   - Receber os dados do bootstrap (id, versão, rootURI, reason)
 *   - Delegar para hooks.ts, onde a lógica real vive
 *
 * Por que não exportar hooks.ts diretamente?
 *   - O bootstrap.js espera um "export default { startup, shutdown }"
 *   - hooks.ts pode ter múltiplas funções internas que não devem ser expostas
 *   - Este arquivo serve como "contrato" entre o mundo JS puro e o TypeScript
 */

import { onStartup, onShutdown } from "./hooks";
import type { AddonData } from "./addon";

export default {
  startup(data: AddonData): void {
    // onStartup é async, mas o bootstrap.js não espera a Promise.
    // O Zotero não suporta startup assíncrono — por isso a lógica
    // dentro de onStartup usa await internamente mas a chamada
    // aqui é "fire and forget".
    onStartup(data);
  },

  shutdown(data: AddonData): void {
    onShutdown(data);
  },
};
