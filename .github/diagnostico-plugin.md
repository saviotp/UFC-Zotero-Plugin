# Diagnóstico — UFC Title Formatter Plugin

## Contexto

Plugin Zotero 8 em desenvolvimento para formatação automática de títulos
conforme normas ABNT UFC (NBR 6023:2018). O `.xpi` foi gerado com sucesso
via `npm run build`, mas **não aparece na lista de plugins após instalação**
no Zotero 8.

---

## Ambiente

| Item | Valor |
|---|---|
| Sistema operacional | macOS (Apple Silicon — MacBook Air) |
| Zotero | 8.x |
| Node.js | (verificar com `node --version`) |
| Template base | windingwind/zotero-plugin-template |
| Build tool | zotero-plugin-scaffold |
| Arquivo gerado | `ufc-title-formatter.xpi` |
| Caminho do `.xpi` | `/Users/saviotp/Documents/Apps/Work/Zotero/ZoteroPlugIns/PlugInUFC/zotero-plugin-template/.scaffold/build/ufc-title-formatter.xpi` |

---

## Conteúdo do manifest.json (extraído do .xpi)

```json
{
  "manifest_version": 2,
  "name": "UFC Title Formatter",
  "version": "1.0.0",
  "description": "Formata títulos ABNT conforme normas da UFC (NBR 6023:2018)",
  "homepage_url": "https://github.com/windingwind/zotero-plugin-template#readme",
  "author": "Biblioteca Universitária — UFC",
  "icons": {
    "48": "content/icons/favicon@0.5x.png",
    "96": "content/icons/favicon.png"
  },
  "applications": {
    "zotero": {
      "id": "ufc-title-formatter@biblioteca.ufc.br",
      "update_url": "https://github.com/windingwind/zotero-plugin-template/releases/download/release/update.json",
      "strict_min_version": "8.0",
      "strict_max_version": "8.*"
    }
  }
}
```

---

## Estrutura do .xpi (verificada via `unzip -l`)

```
bootstrap.js
content/
content/icons/favicon.png
content/icons/favicon@0.5x.png
content/preferences.xhtml
content/scripts/
content/scripts/ufc-title-formatter.js
content/zoteroPane.css
locale/en-US/ufc-title-formatter-addon.ftl
locale/en-US/ufc-title-formatter-mainWindow.ftl
locale/en-US/ufc-title-formatter-preferences.ftl
locale/pt-BR/ufc-title-formatter-addon.ftl
locale/pt-BR/ufc-title-formatter-mainWindow.ftl
locale/pt-BR/ufc-title-formatter-preferences.ftl
locale/zh-CN/ufc-title-formatter-addon.ftl
locale/zh-CN/ufc-title-formatter-mainWindow.ftl
locale/zh-CN/ufc-title-formatter-preferences.ftl
manifest.json
prefs.js
```

---

## Sintoma

- Instalação via **Ferramentas → Complementos → ⚙️ → Instalar complemento
  a partir de arquivo** não retorna erro visível
- O plugin simplesmente **não aparece** na lista de complementos habilitados
  após selecionar o `.xpi`
- Nenhuma mensagem de erro exibida ao usuário

---

## Hipótese principal

O campo `update_url` no `manifest.json` aponta para o repositório do
template original (windingwind), não para o projeto da UFC:

```
"update_url": "https://github.com/windingwind/zotero-plugin-template/releases/download/release/update.json"
```

O Zotero 8 pode estar verificando essa URL durante a instalação e
rejeitando o plugin ao não encontrá-lo listado no `update.json` remoto.

---

## O que já foi tentado

- [ ] Verificar log de erros do Zotero (**Ajuda → Log de erros de depuração**)
- [ ] Corrigir `update_url` no `zotero-plugin.config.ts` para `""` e rebuildar
- [ ] Instalar via arrastar e soltar na janela de Complementos
- [ ] Copiar `.xpi` diretamente para `~/Library/Application Support/Zotero/Profiles/*/extensions/`

---

## Próximos passos solicitados ao Copilot

1. Confirmar se o `update_url` apontando para repositório externo causa
   rejeição silenciosa no Zotero 8
2. Indicar como desativar ou redirecionar o `update_url` no
   `zotero-plugin.config.ts` para ambiente de desenvolvimento local
3. Verificar se há outros campos no `manifest.json` ou no `bootstrap.js`
   que possam causar rejeição silenciosa no Zotero 8
4. Sugerir como ler o log de erros interno do Zotero via
   **Ferramentas → Desenvolvedor → Executar JavaScript**:
   ```javascript
   Zotero.getErrors(true)
   ```

---

## Arquivos relevantes do projeto

| Arquivo | Função |
|---|---|
| `zotero-plugin.config.ts` | Configurações de build — contém `updateURL` |
| `manifest.json` (fonte) | Metadados do plugin antes do build |
| `src/index.ts` | Inicialização e ciclo de vida |
| `src/modules/titleFormatter.ts` | Lógica principal de formatação |
| `.scaffold/build/ufc-title-formatter.xpi` | Artefato gerado |

---

## Comando para inspecionar o log interno do Zotero

No Zotero: **Ferramentas → Desenvolvedor → Executar JavaScript**, cole:

```javascript
var errors = Zotero.getErrors(true);
Zotero.debug(errors.join('\n'));
```

Ou para ver todos os logs recentes:

```javascript
Zotero.Debug.get()
```
