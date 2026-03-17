# Licenças

Este projeto contém dois componentes com licenças diferentes:

## Plugin (código TypeScript)

**Licença:** GNU Affero General Public License v3 (AGPL-3.0-only)

Todo o código-fonte do plugin (diretórios `src/`, `addon/`, `tests/`, e arquivos de configuração) está licenciado sob a AGPL v3, conforme o arquivo [`LICENSE`](LICENSE).

Esta licença é herdada do [zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template) de windingwind, base sobre a qual este plugin foi construído.

**O que isso significa:**
- Você pode usar, modificar e distribuir o código livremente
- Se distribuir versões modificadas, deve disponibilizar o código-fonte sob a mesma licença
- Se usar o código em um serviço de rede, deve disponibilizar o código-fonte aos usuários do serviço

## Estilo CSL (`ufc.csl`)

**Licença:** Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)

O arquivo `ufc.csl` é derivado do estilo ABNT disponível no [repositório oficial Zotero Styles](https://www.zotero.org/styles), que é licenciado sob CC BY-SA 3.0.

**O que isso significa:**
- Você pode usar, modificar e distribuir o estilo livremente
- Deve dar crédito ao estilo original (atribuição)
- Se criar versões derivadas, deve distribuí-las sob a mesma licença ou compatível

## Por que duas licenças?

O estilo CSL e o código do plugin são componentes independentes:
- O CSL é um arquivo XML declarativo processado pela engine citeproc do Zotero
- O plugin é código TypeScript que estende o Zotero via API de complementos

Cada componente herda a licença de seu respectivo projeto base. As duas licenças são compatíveis entre si e ambas são licenças de software livre/código aberto.
