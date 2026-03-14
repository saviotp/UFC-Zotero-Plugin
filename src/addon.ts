/**
 * addon.ts — Classe Addon: estado global do plugin
 *
 * Esta classe segue o padrão Singleton — existe apenas UMA instância
 * durante toda a vida do plugin. Ela centraliza:
 *
 *   1. Metadados do plugin (id, versão, rootURI) que vêm do bootstrap.js
 *   2. Referências aos módulos principais (hooks, toolkit)
 *   3. Constantes usadas em vários lugares (ID do CSL, namespace de prefs)
 *
 * Por que centralizar?
 *   - Vários módulos precisam do rootURI (para encontrar arquivos do plugin)
 *   - O shutdown precisa saber o que o startup registrou (para limpar)
 *   - Evita passar dezenas de parâmetros entre funções
 *
 * Como é acessada?
 *   - O bootstrap.js cria a instância via Addon.startup()
 *   - Outros módulos importam a instância via "import { addon } from './addon'"
 */

/**
 * Interface que descreve os dados recebidos do bootstrap.js
 * quando o Zotero carrega o plugin.
 */
export interface AddonData {
  id: string;
  version: string;
  rootURI: string;
  reason: number;
}

class Addon {
  /**
   * Metadados do plugin, preenchidos no startup().
   * Antes do startup, este campo é undefined.
   */
  public data!: AddonData;

  /**
   * O ID do estilo CSL que o plugin instala no Zotero.
   * Deve corresponder ao <id> no bloco <info> do arquivo ufc.csl.
   * O Zotero usa este ID para identificar o estilo na lista de estilos.
   */
  public readonly cslID = "http://www.zotero.org/styles/universidade-federal-do-ceara-abnt";

  /**
   * Namespace das preferências do plugin.
   * Todas as prefs ficam sob "extensions.ufc-zotero-plugin.*"
   * no sistema de preferências do Gecko.
   */
  public readonly prefNamespace = "extensions.ufc-zotero-plugin";
}

/**
 * Instância singleton exportada.
 * Todos os módulos que precisam de dados do addon importam esta variável.
 */
export const addon = new Addon();
