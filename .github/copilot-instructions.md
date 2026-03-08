# Copilot Instructions — UFC Title Formatter (Zotero Plugin)

## Project Overview

A **Zotero 8+ plugin** (`.xpi`) + **CSL style** (`abnt-ufc.csl`) that automatically formats bibliographic metadata to comply with **ABNT NBR 6023:2018** as interpreted by the UFC (Universidade Federal do Ceará) normalization guides.

**Two deliverables in this repo:**

1. **Plugin** (`src/` → `build/addon/`) — TypeScript compiled to Firefox 128 (SpiderMonkey), bundled via esbuild into a single `ufc-title-formatter.js`.
2. **CSL style** (`abnt-ufc.csl`) — standalone Citation Style Language file installed separately in Zotero.

---

## Architecture

```
src/index.ts          ← Entry point: registers Zotero[addonInstance] singleton
src/addon.ts          ← Addon class: holds .data (state), .hooks, .api
src/hooks.ts          ← Lifecycle: onStartup, onMainWindowLoad, onShutdown, onNotify
src/modules/
  titleFormatter.ts   ← Core domain logic (1170 lines) — the only place with ABNT rules
  preferenceScript.ts ← Preferences pane bindings
src/utils/
  locale.ts           ← Fluent (FTL) i18n wrapper
  prefs.ts            ← Typed wrapper for Zotero.Prefs (prefix: extensions.zotero.ufc-title-formatter)
  ztoolkit.ts         ← ZoteroToolkit instance factory
addon/locale/{en-US,pt-BR,zh-CN}/*.ftl  ← UI strings (Fluent format)
addon/prefs.js        ← Default preference values
```

**Global access pattern:** `addon` and `ztoolkit` are `_globalThis` properties, so all source files access them without import.

---

## Developer Workflows

```bash
npm run start        # Build + serve (hot-reload via zotero-plugin-scaffold)
npm run build        # esbuild bundle + tsc type-check (outputs to build/)
npm run lint:check   # Prettier + ESLint check
npm run lint:fix     # Prettier + ESLint auto-fix
npm run release      # Build release XPI + update manifests
```

**Scaffold config:** `zotero-plugin.config.ts` — controls esbuild entry (`src/index.ts`), output (`build/addon/content/scripts/ufc-title-formatter.js`), and defines constants (`addonName`, `addonID`, etc.) injected at build time from `package.json#config`.

**Testing:** `npm run test` uses `zotero-plugin-scaffold` test runner; waits for `Zotero.UFCTitleFormatter.data.initialized === true`.

---

## Core Domain Logic (`titleFormatter.ts`)

All ABNT formatting rules live exclusively in `src/modules/titleFormatter.ts`. The pipeline for each item via `processarItem()`:

1. **Normalize creator lastNames** → UPPERCASE (ABNT NBR 6023:2018, `fieldMode === 0` only; institutional/literal authors with `fieldMode === 1` are skipped)
2. **Normalize `edition` field** → pure integer string (e.g. `"2a edição"` → `"2"`); en-language items get `"2nd ed."` format instead
3. **Apply bold** via `formatItemTitle()` using three item groups:
   - **Group 1** (`BOLD_ON_TITLE_TYPES`): bold on `title` — autonomous works (book, thesis, film, map, etc.)
   - **Group 2** (`BOLD_ON_CONTAINER_TYPES`): bold on `publicationTitle` — parts of a whole (journalArticle, bookSection, conferencePaper, etc.)
   - **Group 3**: no bold when item has no creators (ABNT uppercase-title-as-entry rule)

**Bold format:** `<b>Main title</b>: subtitle` (colon split). If `<b>` already exists in the field, the item is skipped entirely.

**Anti-loop guard:** `_isFormatting` module-level flag prevents the Zotero Notifier from triggering recursively when the plugin calls `item.saveTx()`.

**Sentence case:** `toSentenceCase()` — called on Group 1 `title` fields always; on other fields only when the `fixUppercase` pref is enabled and `isUpperCase()` returns true (>70% uppercase letters). Brazilian state abbreviations and institutional acronyms in `ALL_ACRONYMS` are preserved in canonical case.

---

## Key Conventions

- **Zotero internal item types ≠ CSL types.** Always use Zotero's internal names (e.g. `"film"` not `"motion_picture"`, `"statute"` not `"legislation"`). Comments in `titleFormatter.ts` map them.
- **`item.setField()` then `item.saveTx()`** — never save inside `setField`; batch all field mutations before a single `saveTx()`.
- **Preferences:** Define in `addon/prefs.js`, declare types in `typings/prefs.d.ts` (auto-generated shape via scaffold), access via `getPref("key")` / `setPref("key", value)` from `src/utils/prefs.ts`. Current prefs: `enable` (boolean), `fixUppercase` (boolean).
- **i18n strings:** Add to all three locale files (`en-US`, `pt-BR`, `zh-CN`) using Fluent `.ftl` syntax; access via `getString("key")` or `getString("key", { args: { count: "1" } })`.
- **Build-time constants** (`addonName`, `addonID`, `addonRef`, `addonInstance`, `prefsPrefix`) are injected from `package.json#config` — never hardcode them in source.
- **TypeScript target:** Firefox 128 / ES2022 via esbuild; `tsconfig.json` is for type-checking only (`noEmit`).

---

## Key Files Reference

| File                                                   | Purpose                      |
| ------------------------------------------------------ | ---------------------------- |
| `src/modules/titleFormatter.ts`                        | All ABNT normalization rules |
| `abnt-ufc.csl`                                         | CSL citation/reference style |
| `zotero-plugin.config.ts`                              | Build configuration          |
| `typings/prefs.d.ts`                                   | Typed preference keys        |
| `addon/locale/pt-BR/addon.ftl`                         | Primary UI strings           |
| `guia-referencias-2023.txt` / `guia-citacoes-2025.txt` | Normative source documents   |
