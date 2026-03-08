// notifications.ts — helpers para exibir notificações e popups do plugin

import { getString } from "../utils/locale";

export function mostrarResultado(formattedCounts: { title?: number; container?: number; publisher?: number; creators?: number; edition?: number; skipped?: number; }) {
  const parts: string[] = [];
  if (formattedCounts.title && formattedCounts.title > 0) {
    parts.push(getString("format-success-title", { args: { count: String(formattedCounts.title) } }));
  }
  if (formattedCounts.container && formattedCounts.container > 0) {
    parts.push(getString("format-success-container", { args: { count: String(formattedCounts.container) } }));
  }
  if (formattedCounts.publisher && formattedCounts.publisher > 0) {
    parts.push(getString("format-success-publisher", { args: { count: String(formattedCounts.publisher) } }));
  }
  if (formattedCounts.creators && formattedCounts.creators > 0) {
    parts.push(getString("format-success-creators", { args: { count: String(formattedCounts.creators) } }));
  }
  if (formattedCounts.edition && formattedCounts.edition > 0) {
    parts.push(getString("format-success-edition", { args: { count: String(formattedCounts.edition) } }));
  }

  const message = parts.length > 0 ? parts.join(" ") : getString("format-no-changes");

  const pw = new ztoolkit.ProgressWindow(addon.data.config.addonName, { closeOnClick: true });
  pw.createLine({ text: message, type: parts.length > 0 ? "success" : "default" }).show();
}
