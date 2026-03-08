import {
  registerTitleFormatterNotifier,
  unregisterTitleFormatterNotifier,
  registerContextMenu,
  // Portuguese aliases (backwards-compatible)
  registrarNotificadorFormatador,
  desregistrarNotificadorFormatador,
  registrarMenuDeContexto,
} from "./modules/titleFormatter";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  // Registrar painel de preferências
  Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    src: rootURI + "content/preferences.xhtml",
    label: getString("prefs-title"),
    image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.png`,
  });

  // Registrar observer de itens (add/modify)
  // Prefer using Portuguese alias within hooks for readability
  if (typeof registrarNotificadorFormatador === "function") {
    registrarNotificadorFormatador();
  } else {
    registerTitleFormatterNotifier();
  }

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );

  // Mark initialized as true to confirm plugin loading status
  // outside of the plugin (e.g. scaffold testing process)
  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();

  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  const popupWin = new ztoolkit.ProgressWindow(addon.data.config.addonName, {
    closeOnClick: true,
    closeTime: -1,
  })
    .createLine({
      text: getString("startup-begin"),
      type: "default",
      progress: 0,
    })
    .show();

  await Zotero.Promise.delay(500);
  popupWin.changeLine({
    progress: 50,
    text: `[50%] ${getString("startup-begin")}`,
  });

  // Global error handlers to surface uncaught rejections/errors in Dev
  try {
    win.addEventListener("unhandledrejection", (ev: any) => {
      try {
        ztoolkit.log("[UFC] window.unhandledrejection:", ev.reason);
      } catch (e) {
        // swallow
      }
    });

    win.addEventListener("error", (ev: any) => {
      try {
        ztoolkit.log("[UFC] window.error:", ev.message || ev.error || ev);
      } catch (e) {
        // swallow
      }
    });
  } catch (e) {
    // Some older windows may not allow adding listeners; ignore safely
  }

  // Registrar menu de contexto (botão direito → "Formatar título")
  if (typeof registrarMenuDeContexto === "function") {
    registrarMenuDeContexto();
  } else {
    registerContextMenu();
  }

  await Zotero.Promise.delay(500);

  popupWin.changeLine({
    progress: 100,
    text: `[100%] ${getString("startup-finish")}`,
  });
  popupWin.startCloseTimer(3000);
}

async function onMainWindowUnload(_win: Window): Promise<void> {
  ztoolkit.unregisterAll();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Desregistrar o observer de títulos
  unregisterTitleFormatterNotifier();
  // Remove addon object
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

/**
 * Dispatcher para eventos do Notifier.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  ztoolkit.log("notify", event, type, ids, extraData);
  // O processamento de títulos é feito diretamente no notifier
  // registrado em titleFormatter.ts
}

/**
 * Dispatcher para eventos da tela de Preferências.
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintain.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
};
