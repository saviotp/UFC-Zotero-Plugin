// Importa os tipos do pacote zotero-types (API principal do Zotero).
// O triple-slash reference é a forma de incluir tipos de pacotes
// que usam "types" no package.json em vez de @types/.
/// <reference types="zotero-types" />

/**
 * global.d.ts — Declarações de tipo para globais do Gecko/Zotero
 *
 * O código do plugin roda dentro do Zotero (baseado no Gecko/Firefox),
 * onde existem objetos globais que o TypeScript não conhece nativamente.
 *
 * O pacote `zotero-types` cobre a API principal do Zotero, mas NÃO cobre:
 *   - Globais do Gecko (Services, Cc, Ci, ChromeUtils)
 *   - APIs internas que usamos via monkey-patching
 *   - Constantes do bootstrap (APP_STARTUP, etc)
 *
 * `declare` diz ao TypeScript: "isso existe em runtime, confie em mim".
 * Nenhuma linha aqui gera código JavaScript — é puramente para
 * checagem de tipos durante a compilação.
 */

// ─── Globais do Gecko (motor do Firefox/Zotero) ────────────────────

/**
 * Services — Acesso a serviços do sistema Gecko.
 *
 * É um objeto que agrega dezenas de serviços do Gecko, como:
 *   Services.prefs  → sistema de preferências (nsIPrefBranch)
 *   Services.io     → manipulação de URIs
 *   Services.locale → informações de localização
 *
 * Equivale a chamar Cc["@mozilla.org/..."].getService(Ci.nsI...)
 * para cada serviço, mas de forma mais conveniente.
 */
declare const Services: any;

/**
 * Cc (Components.classes) — Fábrica de componentes XPCOM.
 *
 * XPCOM é o sistema de componentes do Gecko (similar a COM no Windows).
 * Cc["@mozilla.org/algo;1"] retorna uma fábrica que cria instâncias
 * daquele componente. Usado no bootstrap.js para acessar o
 * AddonManagerStartup que registra o chrome://.
 */
declare const Cc: any;

/**
 * Ci (Components.interfaces) — Interfaces XPCOM.
 *
 * Define os "contratos" dos componentes XPCOM.
 * Por exemplo, Ci.amIAddonManagerStartup é a interface que define
 * o método registerChrome() usado no bootstrap.js.
 */
declare const Ci: any;

/**
 * ChromeUtils — Utilitários privilegiados do Gecko.
 *
 * Diferente do Chrome do navegador Google! No contexto Gecko,
 * "chrome" é o nome para código privilegiado (com acesso total ao sistema).
 *
 * ChromeUtils.importESModule() carrega ES Modules no contexto
 * privilegiado — é assim que o bootstrap.js importa nosso index.ts compilado.
 */
declare const ChromeUtils: any;

// ─── Constantes do bootstrap ───────────────────────────────────────

/**
 * Razões passadas pelo Gecko às funções do bootstrap.js.
 * Indicam POR QUE a função foi chamada.
 *
 * APP_STARTUP (1)      → O Zotero está iniciando
 * APP_SHUTDOWN (2)     → O Zotero está fechando
 * ADDON_ENABLE (3)     → O usuário ativou o plugin
 * ADDON_DISABLE (4)    → O usuário desativou o plugin
 * ADDON_INSTALL (5)    → O plugin foi instalado agora
 * ADDON_UNINSTALL (6)  → O plugin foi removido
 * ADDON_UPGRADE (7)    → O plugin foi atualizado para nova versão
 * ADDON_DOWNGRADE (8)  → O plugin foi revertido para versão anterior
 */
declare const APP_STARTUP: number;
declare const APP_SHUTDOWN: number;
declare const ADDON_ENABLE: number;
declare const ADDON_DISABLE: number;
declare const ADDON_INSTALL: number;
declare const ADDON_UNINSTALL: number;
declare const ADDON_UPGRADE: number;
declare const ADDON_DOWNGRADE: number;

// ─── Extensões ao Zotero ───────────────────────────────────────────

/**
 * Extensões que nosso plugin e o monkey-patching utilizam.
 *
 * O Zotero.Cite é um namespace interno do Zotero que contém funções
 * de formatação de citações e bibliografias. Ele existe em runtime
 * mas não está coberto pelo zotero-types.
 *
 * Usamos "declare namespace" para adicionar tipos ao Zotero existente
 * sem conflitar com os tipos já definidos pelo pacote zotero-types.
 */
declare namespace Zotero {
  namespace Cite {
    let makeFormattedBibliographyOrCitationList: (...args: any[]) => any;
  }

  namespace Styles {
    function get(id: string): any;
    function install(
      cslText: string,
      origin: string,
      update: boolean,
    ): Promise<void>;
  }

  function debug(message: string): void;
  function logError(message: string): void;

  const initializationPromise: Promise<void>;
}
