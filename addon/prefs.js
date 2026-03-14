// prefs.js — Valores padrão das preferências do plugin
//
// O Gecko (motor do Zotero/Firefox) tem um sistema de preferências
// persistentes. Cada chamada a pref() registra uma preferência com
// um nome (string), tipo (string/int/bool) e valor padrão.
//
// Essas preferências ficam salvas no perfil do usuário e sobrevivem
// ao reinício do Zotero. O usuário pode alterá-las via a tela de
// preferências do plugin ou via about:config (debug).
//
// O namespace "extensions.__addonRef__" será substituído pelo scaffold
// durante o build pelo nome real do plugin.

// Habilita/desabilita o pós-processamento de referências.
// Se false, o plugin só instala o CSL mas não corrige formatações.
// Útil para debug: se algo estiver errado nas referências, o usuário
// pode desativar o pós-processamento para isolar se o problema
// está no CSL ou no plugin.
pref("extensions.__addonRef__.postprocess.enabled", true);
