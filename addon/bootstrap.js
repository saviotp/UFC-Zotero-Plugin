// bootstrap.js — Ponto de entrada do plugin para o Zotero 8
//
// O Zotero 8 usa a arquitetura "bootstrapped extension" do Gecko/Firefox.
// Isso significa que este arquivo é o PRIMEIRO código que o Zotero executa
// quando o plugin é carregado. Ele deve exportar 4 funções globais:
//   startup(), shutdown(), install(), uninstall()
//
// Este arquivo é JavaScript puro (não TypeScript) porque o Zotero o carrega
// diretamente, sem bundler. Ele funciona como uma "ponte" que delega o
// trabalho real para o nosso código TypeScript compilado (src/index.ts → index.js).

// ChromeUtils é uma API global do Gecko que permite importar módulos.
// Services dá acesso a serviços do sistema (timers, preferências, etc).
var chromeHandle;

/**
 * startup() — Chamada quando o Zotero carrega o plugin.
 *
 * Isso acontece em 3 situações:
 *   1. O Zotero inicia e o plugin já está instalado
 *   2. O usuário instala o plugin enquanto o Zotero está aberto
 *   3. O usuário reativa um plugin que estava desativado
 *
 * @param {object} data - Metadados do plugin (id, versão, rootURI, etc)
 * @param {number} reason - Código numérico indicando por que o startup foi chamado
 *                          (APP_STARTUP, ADDON_ENABLE, ADDON_INSTALL, ADDON_UPGRADE)
 */
function startup({ id, version, resourceURI, rootURI }, reason) {
  // rootURI é o caminho base do plugin no sistema de arquivos do Gecko.
  // Exemplo: "jar:file:///path/to/plugin.xpi!/"
  // Precisamos dele para registrar o esquema chrome:// que permite
  // ao Zotero encontrar nossos arquivos (JS, XHTML, locales, etc).

  // Asc.init() registra o mapeamento chrome:// para o conteúdo do plugin.
  // Depois disso, "chrome://ufc-zotero-plugin/content/..." resolve para
  // os arquivos dentro de addon/content/.
  var aomStartup = Cc[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Ci.amIAddonManagerStartup);
  var manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "__addonRef__", "content/"],
    ["locale", "__addonRef__", "pt-BR", "locale/pt-BR/"],
    ["locale", "__addonRef__", "en-US", "locale/en-US/"],
  ]);

  // Importa o módulo principal do plugin (compilado de src/index.ts).
  // ChromeUtils.importESModule carrega um ES Module no contexto privilegiado
  // do Gecko — diferente de um import() normal do browser.
  const { default: Addon } = ChromeUtils.importESModule(
    rootURI + "content/index.js"
  );

  // Instancia o addon e o torna acessível globalmente.
  // O objeto Zotero.__addonRef__ permite que outros módulos acessem
  // a instância do plugin (útil para preferências, debug, etc).
  Addon.startup({ id, version, rootURI, reason });
}

/**
 * shutdown() — Chamada quando o plugin é descarregado.
 *
 * Isso acontece quando:
 *   1. O Zotero fecha (APP_SHUTDOWN)
 *   2. O plugin é desativado pelo usuário (ADDON_DISABLE)
 *   3. O plugin é desinstalado (ADDON_UNINSTALL)
 *   4. O plugin é atualizado (ADDON_UPGRADE)
 *
 * IMPORTANTE: Aqui devemos "limpar" tudo que o plugin fez:
 *   - Remover listeners, observers, timers
 *   - Fechar janelas abertas pelo plugin
 *   - Liberar referências para evitar memory leaks
 *
 * Se reason === APP_SHUTDOWN, o Zotero está fechando e a limpeza é
 * menos crítica (o processo vai morrer de qualquer forma).
 */
function shutdown({ id, version, rootURI }, reason) {
  // APP_SHUTDOWN = o Zotero está fechando inteiramente.
  // Nesse caso, não precisamos limpar nada — o processo vai encerrar.
  if (reason === APP_SHUTDOWN) {
    return;
  }

  // Para outros casos (desinstalar, desativar, atualizar), delegamos
  // a limpeza para o nosso código TypeScript.
  const { default: Addon } = ChromeUtils.importESModule(
    rootURI + "content/index.js"
  );
  Addon.shutdown({ id, version, rootURI, reason });

  // Remove o registro chrome:// para que o Zotero não tente acessar
  // arquivos de um plugin que não está mais ativo.
  chromeHandle.destruct();
  chromeHandle = null;
}

/**
 * install() — Chamada UMA VEZ quando o plugin é instalado pela primeira vez.
 *
 * Útil para migrações de dados ou setup inicial.
 * No nosso caso, não precisamos fazer nada especial aqui — a instalação
 * do CSL é feita no startup() pelo csl-manager.
 */
function install(data, reason) {}

/**
 * uninstall() — Chamada quando o plugin é completamente removido.
 *
 * Poderia ser usada para limpar preferências ou dados persistidos.
 * Por ora, não precisamos de nada aqui.
 */
function uninstall(data, reason) {}
