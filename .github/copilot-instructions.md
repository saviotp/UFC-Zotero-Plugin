# Zotero Plugin — UFC Title Formatter

## Objetivo

Plugin para Zotero 8+ que detecta o separador `:` no campo `title` dos
itens e envolve automaticamente o texto anterior em tags `<b>...</b>`,
conforme exigido pelas normas ABNT da Universidade Federal do Ceará (UFC)
para formatação de títulos em trabalhos acadêmicos (TCC, dissertações e teses).

A norma ABNT NBR 6023:2018, interpretada pelo Guia de Normalização da UFC
(edições 2023/2025), determina que apenas o **título principal** (antes dos
dois pontos) deve receber destaque tipográfico — negrito ou itálico —
enquanto o **subtítulo** (após os dois pontos) deve permanecer sem formatação.

O Zotero suporta esse comportamento por meio de tags HTML inseridas
diretamente no campo `title`, como documentado em:
https://www.zotero.org/support/kb/rich_text_bibliography

---

## Versão alvo

- **Zotero 8.0+**
- O Zotero adotou ciclo de releases rápido a partir da versão 8
  (novas versões a cada 6–10 semanas). Verificar compatibilidade
  via `Zotero.platformMajorVersion`.
- `strict_min_version`: `"8.0"` no `manifest.json`

---

## Stack

- **Linguagem:** TypeScript
- **Build:** zotero-plugin-scaffold + esbuild
- **Template base:** windingwind/zotero-plugin-template
- **Ambiente:** VS Code + GitHub Copilot

---

## Estrutura do projeto

```
zotero-plugin-template/
├── manifest.json               ← metadados do plugin (ID, versão, nome)
├── zotero-plugin.config.ts     ← configurações de build
├── src/
│   ├── index.ts                ← inicialização e ciclo de vida do plugin
│   └── modules/
│       └── titleFormatter.ts   ← lógica principal (arquivo a criar)
├── addon/
│   ├── content/
│   │   └── preferences.xhtml   ← tela de preferências (se necessário)
│   └── locale/
│       └── pt-BR/              ← traduções em português
└── .github/
    └── copilot-instructions.md ← este arquivo
```

---

## Regras de negócio

1. **Título com subtítulo** — texto antes do primeiro `:` recebe `<b>...</b>`;
   subtítulo (após `:`) permanece sem tag:
   ```
   Entrada:  "Educação escolar: políticas, estrutura e organização"
   Saída:    "<b>Educação escolar</b>: políticas, estrutura e organização"
   ```

2. **Título sem subtítulo** — título inteiro recebe `<b>...</b>`:
   ```
   Entrada:  "Cadê os operários?"
   Saída:    "<b>Cadê os operários?</b>"
   ```

3. **Tags já existentes** — não sobrescrever se `<b>` já estiver presente:
   ```
   Entrada:  "<b>Título já formatado</b>: subtítulo"
   Saída:    (sem alteração)
   ```

4. **Dois pontos que não separam subtítulo** — aplicar apenas no **primeiro** `:`.

5. **Itens sem campo title** — ignorar silenciosamente.

6. **Tipos de item a processar** — todos os tipos bibliográficos do Zotero
   (`book`, `journalArticle`, `thesis`, `webpage`, `conferencePaper`, etc.).

7. **Gatilho** — o processamento deve ocorrer:
   - Ao **salvar** um item (`event === "modify"` no Notifier)
   - Ao **importar** itens em lote (`event === "add"`)
   - Via **comando manual** no menu de contexto do item (botão direito)

8. **Flag anti-loop** — usar variável de controle para evitar loop infinito
   ao salvar o item dentro do próprio observer de `modify`.

---

## API do Zotero relevante

### Registrar observer (escutar eventos de item)
```typescript
const observerID = Zotero.Notifier.registerObserver(
  {
    notify: async (event, type, ids, extraData) => {
      if (type === "item" && (event === "add" || event === "modify")) {
        for (const id of ids) {
          const item = await Zotero.Items.getAsync(id);
          if (item) await formatTitle(item);
        }
      }
    },
  },
  ["item"],
  "ufc-title-formatter"
);
```

### Ler e escrever o campo title
```typescript
const title = item.getField("title") as string;
item.setField("title", newTitle);
await item.saveTx();
```

### Desregistrar observer (ao desativar o plugin)
```typescript
Zotero.Notifier.unregisterObserver(observerID);
```

### Ciclo de vida do plugin (src/index.ts)
```typescript
async function startup({ id, version, rootURI }) {
  // Registrar observers, menus, preferências
}

function shutdown() {
  // Desregistrar observers e limpar recursos
}
```

---

## manifest.json esperado

```json
{
  "manifest_version": 2,
  "name": "UFC Title Formatter",
  "version": "1.0.0",
  "description": "Formata títulos ABNT conforme normas da UFC (NBR 6023:2018)",
  "author": "Biblioteca Universitária — UFC",
  "applications": {
    "zotero": {
      "id": "ufc-title-formatter@biblioteca.ufc.br",
      "strict_min_version": "8.0"
    }
  }
}
```

---

## Fontes dos Guias UFC (PDFs públicos)

| Guia | URL |
|---|---|
| Trabalhos Acadêmicos | https://biblioteca.ufc.br/wp-content/uploads/2022/05/guianormalizacaotrabalhosacademicos-17.05.2022.pdf |
| Artigo Científico | https://biblioteca.ufc.br/wp-content/uploads/2023/04/guia-de-normalizacao-de-artigo-corrigido-27.04.2023.pdf |
| Citações (2025) | https://biblioteca.ufc.br/wp-content/uploads/2025/06/guianormalizacaocitacoes2025.pdf |
| Referências (2023) | https://biblioteca.ufc.br/wp-content/uploads/2023/12/guianormalizacaoreferencias.pdf |
| Projetos de Pesquisa | https://biblioteca.ufc.br/wp-content/uploads/2019/10/guia-de-projetos-06.10.2019.pdf |

---

## ♟ JOGO DE DEBUG: ABNT vs. Plugin + CSL

> **Regra do jogo:** cada bloco abaixo mostra o output esperado pela ABNT
> (folha de resposta) para um tipo de referência ou citação.
> O plugin + arquivo `.csl` deve produzir output idêntico.
> Qualquer divergência é um bug a corrigir.

---

### REFERÊNCIAS — Guia UFC 2023

#### 3.1.1.1 — Livro (elementos essenciais)

```
LESSA, Sérgio. Cadê os operários? São Paulo: Instituto Lukacs, 2014.

MARCONI, Marina de Andrade; LAKATOS, Eva Maria. Metodologia científica.
4. ed. São Paulo: Atlas, 2004.

LIBÂNEO, José Carlos; OLIVEIRA, João Ferreira de; TOSCHI, Mirza Seabra.
Educação escolar: políticas, estrutura e organização. São Paulo: Cortez, 2012.

FARIAS, I. M. S.; SALES, J. C. B.; BRAGA, M. M. S. C.; FRANÇA, M. do S. L. M.
Didática e docência. 4. ed. Brasília, DF: Liber Livro, 2014.

FARIAS, I. M. S. et al. Didática e docência. 4. ed. Brasília, DF: Liber Livro, 2014.

RUA, João et al. Para ensinar geografia: contribuições para os trabalhos com
1º e 2º graus. Rio de Janeiro: ACCESS, 1993.

AULETE, Caldas. Dicionário contemporâneo da língua portuguesa.
3. ed. Rio de Janeiro: Delta, 1980.

O'HARA, Georgina. Enciclopédia da moda: de 1840 à década de 90.
São Paulo: Companhia das Letras, 2007.

UNIVERSIDADE FEDERAL DO CEARÁ. Biblioteca Universitária.
Relatório de atividades 2011. Fortaleza: Biblioteca Universitária, 2011.

COLLINS dicionário: inglês-português, português-inglês. 6th ed. Glasgow: Collins, 2009.
```

#### 3.1.1.1 — Livro (elementos complementares)

```
KUPER, Adam. A reinvenção da sociedade primitiva: transformações de um mito.
Tradução de Simone Miziara Frangella. Recife: Ed. Universitária da UFPE, 2008. 338 p.

LESSA, Sérgio. Cadê os operários? São Paulo: Instituto Lukacs, 2014.
96 p. ISBN 978-85-65999-18-2.
```

#### 3.1.1.2 — Livro eletrônico (elementos essenciais)

```
CASTRO, José Esteban. Água e democracia na América Latina.
Campina Grande: EDUEPB, 2016. E-book. Disponível em:
http://books.scielo.org/id/tn4y9/pdf/castro-9788578794866.pdf. Acesso em: 22 ago. 2019.

FERREIRA, Aurélio Buarque de Holanda. Dicionário Aurélio da língua portuguesa.
5. ed. Curitiba: Positivo, 2010. Disponível em:
https://pergamum.ufc.br/pergamum/biblioteca/index.php. Acesso em: 12 fev. 2019.
```

#### 3.1.1.3 — Capítulo de livro (elementos essenciais)

```
MULLER, Geraldo. O macroeixo São Paulo-Buenos Aires e a gestão territorializada
de governos subnacionais. In: CASTRO, Iná Elias de; MIRANDA, Mariana; EGLER,
Claudio (org.). Redescobrindo o Brasil: 500 anos depois. Rio de Janeiro:
Bertrand Brasil: FAPERJ, 1999. p. 41-55.

NEVES, D. P. Amebas de vida livre. In: NEVES, D. P. Parasitologia humana.
11. ed. São Paulo: Atheneu, 2005. cap. 16.
```

#### 3.1.1.4 — Capítulo de livro eletrônico (elementos essenciais)

```
SILVA, Reginaldo Oliveira. Hilda Hilst no fluxo da consciência: o horizonte
estético de contos d'escárnio. In: SILVA, Reginaldo Oliveira. Uma superfície
de gelo ancorada no riso: a atualidade do grotesco em Hilda Hilst.
Campina Grande: EDUEPB, 2013. p. 199-292. Disponível em:
http://books.scielo.org/id/wwfpz. Acesso em: 1 abr. 2016.
```

#### 3.1.2.1 — Tese / Dissertação (elementos essenciais)

```
BENEGAS, M. Três ensaios em análise econômica. 2006. Tese (Doutorado em
Economia) – Faculdade de Economia, Administração, Atuária e Contabilidade,
Universidade Federal do Ceará, Fortaleza, 2006.

MAYORGA, Rodrigo de Oliveira. Análise de transmissão de preços do mercado
de melão do Brasil. 2006. Dissertação (Mestrado em Economia Rural) –
Centro de Ciências Agrárias, Universidade Federal do Ceará, Fortaleza, 2006.
```

#### 3.1.2.1 — Tese / Dissertação (elementos complementares)

```
CHAGAS JÚNIOR, L. W. R. Reuso de água tendo como estudo de caso o projeto
do Aeroporto Zumbi dos Palmares. 2006. 47 p. Trabalho de conclusão de curso
(Especialização em Avaliações e Perícias de Engenharia) – Centro de Tecnologia,
Universidade Federal do Ceará, Fortaleza, 2006.
```

#### 3.1.2.2 — Tese eletrônica (elementos essenciais)

```
LOURENÇO, Ronaldo Mendes. Proposta de modelo físico-socioambiental para o
estudo de bacias hidrográficas semiáridas do nordeste setentrional (Brasil).
2018. Tese (Doutorado em Geografia) – Centro de Ciências, Universidade
Federal do Ceará, Fortaleza, 2018. Disponível em:
http://www.repositorio.ufc.br/handle/riufc/39044. Acesso em: 13 fev. 2019.
```

#### 3.2.1 — Correspondência

```
SANTOS, Heitor. [Carta para o filho]. Destinatário: Jefferson Amorim da Silva.
Caucaia, 2019. 1 carta.
```

#### 3.3.7 — Artigo de periódico (elementos essenciais)

```
HOFFMANN, C. A autoridade e a questão do pai. Ágora: estudos em teoria
psicanalítica, Rio de Janeiro, v. 9, n. 2, p. 169-176, jul. 2006.
```

#### 3.3.8 — Artigo de periódico eletrônico (elementos essenciais)

```
SOUZA, Maria Alice Veiga Ferreira de. Impactos da gestão de aulas baseadas
em problemas verbais de matemática sobre a aprendizagem. Educar em Revista,
Curitiba, v. 33, n. 64, p. 231-246, abr. 2017. DOI 10.1590-0104-4060.46978.
Disponível em: https://revistas.ufpr.br/educar/article/view/46978/32186.
Acesso em: 14 fev. 2019.

LAVALLE, Adrián Gurza; ISUNZA VERA, Ernesto. Representación y participación
en la crítica democrática. Desacatos, Ciudad del México, v. 49, p. 10-27, 2015.
Disponível em: https://desacatos.ciesas.edu.mx/index.php/Desacatos/article/view/150.
Acesso em: 31 jul. 2019.
```

#### 3.3.9 — Artigo de jornal impresso

```
BARROS, Luana. STF deve concluir hoje julgamento sobre criminalização da
homofobia. O Povo, Fortaleza, ano 43, n. 30.547, 14 fev. 2019. Caderno política, p. 11.
```

#### 3.3.10 — Artigo de jornal eletrônico

```
BOECHAT: Anac suspende empresa dona do helicóptero. O Estado, Fortaleza,
ano 82, n. 23.475, 14 fev. 2019. Caderno Nacional, p. 6. Disponível em:
http://www.oestadoce.com.br/digital. Acesso em: 14 fev. 2019.
```

#### 3.4.2.1 — Trabalho em evento (monografia, elementos essenciais)

```
DIAS, R. L. Parque Nacional do Pico da Neblina: conservação, pesquisa e
divulgação. In: CONGRESSO BRASILEIRO DE UNIDADES DE CONSERVAÇÃO, 4., 2004,
Curitiba. Anais [...]. Curitiba: Fundação Boticário de Proteção à Natureza,
2004. p. 45-54.
```

#### 3.4.2.3 — Trabalho em evento (publicação periódica)

```
ABREU, Márcia. O perigo dos livros. Cadernos do Centro de Pesquisas Literárias
da PUCRS, Porto Alegre, v. 12, n. 1, p. 41-51, 2006. Trabalho apresentado no
Seminário Internacional de História da Literatura, 6., 2005, Porto Alegre.
```

#### 3.5.1 — Patente

```
SCHROEDER, Alfred A.; CREDLE, William S. Aparelho para servir bebidas e processo
para converter um aparelho para servir bebidas. Depositante: The Coca-Cola
Company. PI 8706898-2 B1. Depósito: 29 mar. 1988. Concessão: 29 out. 1991.
```

#### 3.5.2 — Patente eletrônica

```
ARAÚJO, Francisco José Freire de. Processo para o preparo do adubo de caranguejo.
Depositante: Universidade Federal do Ceará. PI0704286-8 A2.
Depósito: 9 nov. 2007. Concessão: 7 jul. 2009. Disponível em:
https://busca.inpi.gov.br/pePI/servlet/PatenteServletController.
Acesso em: 27 nov. 2023.
```

#### 3.6.1 — Legislação impressa

```
BRASIL. Constituição da República Federativa do Brasil: promulgada em
5 de outubro de 1988. 31. ed. São Paulo: Saraiva, 2003.
```

#### 3.6.2 — Legislação eletrônica

```
BRASIL. Lei nº 12.305, de 2 de agosto de 2010. Institui a Política Nacional
de Resíduos Sólidos. Brasília, DF: Casa Civil, 2010. Disponível em:
http://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm.
Acesso em: 13 fev. 2019.

FORTALEZA. Lei nº 10.851, de 02 de janeiro de 2019. Institui a Política
Pública e Programa de Conscientização do Uso Responsável de Água Potável
no município de Fortaleza. Fortaleza: Diário Oficial do Município, 1 fev. 2019.
Disponível em: http://apps.fortaleza.ce.gov.br/diariooficial/download-diario.php.
Acesso em: 25 jan. 2019.
```

#### 3.8.1 — Filme / vídeo

```
ALZHEIMER: mudanças na comunicação e no comportamento.
Direção: Thereza Jessouroun. [Rio de Janeiro]: Kino Filmes, 2011. 1 DVD (26 min).

TIM MAIA in concert. [Manaus]: Pólo Industrial de Manaus, 2007. 1 DVD.
```

#### 3.8.3 — Documento sonoro

```
BRASILIZAÇÃO. Fortaleza: Estúdio Santa Música, 2006. 1 CD.
```

#### 3.8.4 — Parte de documento sonoro

```
ANGÉLICA, Joana. Flor da paisagem. In: ANGÉLICA, Joana. Cantando coisas
de cá. Fortaleza: Radiadora Cultural, 2007. 1 CD, faixa 8.
```

#### 3.9.1 — Partitura

```
ARAÚJO, João Gomes de. A brilhante aurora: mazurka de salão. Rio de Janeiro:
Narciso & Arthur Napoleão, [1870]. 1 partitura. Piano solo.
```

#### 3.9.2 — Partitura eletrônica

```
GONZAGA, Chiquinha. A noiva. [S. l., 19--]. 1 partitura. Piano. Disponível em:
http://www.chiquinhagonzaga.com/acervo/partituras/a-noite_piano.pdf.
Acesso em: 30 jul. 2019.
```

#### 3.10.1 — Documento iconográfico

```
PORTINARI, C. Café. 1935. 1 reprodução, óleo sobre tela, 130 x 195 cm.
```

#### 3.10.2 — Documento iconográfico eletrônico

```
MOREIRA, Jair Célio. Caló montada em seu burrinho. 2016. Disponível em:
https://www.facebook.com/photo.php?fbid=1220904821321837.
Acesso em: 28 jul. 2019.
```

#### 3.11.1 — Documento cartográfico

```
FUNDAÇÃO INSTITUTO DE PLANEJAMENTO DO CEARÁ. Atlas do Ceará.
Fortaleza, 1997. 1 atlas.
```

#### 3.11.2 — Documento cartográfico eletrônico

```
IBGE. Diretoria de Geodesia e Cartografia. Desigualdade econômica: infância.
Rio de Janeiro, 2010. 1 mapa. Escala 1:30.000.000. Disponível em:
https://atlasescolar.ibge.gov.br/images/atlas/mapas_brasil/brasil_infancia.pdf.
Acesso em: 25 maio 2019.
```

#### 3.13.4 — Redes sociais

```
COUTO, Mia. A saudade. Cidade da Beira, 17 ago. 2019. Facebook:
@miacoutooficial. Disponível em:
https://www.facebook.com/miacoutooficial/photos/a.298941346819589/1244373005609747/.
Acesso em: 22 fev. 2019.

CONSELHO NACIONAL DE DESENVOLVIMENTO CIENTÍFICO E TECNOLÓGICO.
O Brasil tem ciência de alta qualidade e pesquisadores de excelência
reconhecida nacional e internacionalmente. Brasília, DF, 8 jul. 2019.
Twitter: @CNPq_Oficial. Disponível em:
https://twitter.com/CNPq_Oficial/status/1148340918141018118.
Acesso em: 22 ago. 2019.
```

#### 3.13.6 — Website

```
UNIVERSIDADE FEDERAL DO CEARÁ. Biblioteca Universitária.
Biblioteca Universitária. Fortaleza: UFC, 2019. Disponível em:
http://www.biblioteca.ufc.br. Acesso em: 18 maio 2019.

AVAST SOFTWARE. Avast antivirus. Praga, 2019. Disponível em:
https://www.avast.com/index#pc. Acesso em: 29 jul. 2019.
```

#### 3.14.1 — Entrevista publicada

```
DUVAL, Raymond. Entrevista: Raymond Duval e a teoria dos registros de
representação semiótica. [Entrevista cedida a] José Luiz Magalhães de Freitas
e Veridiana Rezende. Revista Paranaense de Educação Matemática,
Campo Mourão, v. 2, n. 3, p. 10-34, jul./dez. 2020.
```

#### 3.14.3 — Resenha

```
CAMPOS FILHO, Lindberg S. Brecht, Benjamin e a questão do engajamento.
Margem Esquerda, São Paulo, n. 32, p. 149-152, maio 2019. Resenha da obra:
BENJAMIN, Walter. Ensaios sobre Brecht. São Paulo: Boitempo, 2017. 152 p.
```

#### 3.14.5 — Bula de remédio

```
XELJANZ. Responsável técnico: Carolina C. S. Rizoli. São Paulo: Pfizer, 2017.
1 bula de remédio.
```

#### 3.14.7 — Psicografia

```
CAMPOS, Humberto de (Espírito). Brasil, coração do mundo, pátria do evangelho.
Psicografado por Francisco Cândido Xavier. Brasília, DF: FEB, 2015.
```

#### 3.14.9 — Bíblia (no todo)

```
BÍBLIA. Português. Bíblia sagrada. 2. ed. Barueri: Sociedade Bíblica do Brasil, 1999.
```

#### 3.14.11 — Parte de Bíblia

```
BÍBLIA. A. T. Eclesiastes. In: BÍBLIA. Bíblia sagrada: antigo e novo testamento.
São Paulo: Vida, 2001. p. 362-367.
```

#### Norma técnica (ABNT)

```
ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 6023:
informação e documentação: referências: elaboração.
Rio de Janeiro: ABNT, 2018.

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 10520:
informação e documentação: citações em documentos: apresentação.
Rio de Janeiro: ABNT, 2023.
```

---

### CITAÇÕES — Guia UFC 2025 (Sistema autor-data)

#### Citação direta com até 3 linhas

```
"A ética procura o fundamento do valor que norteia o comportamento,
partindo da historicidade presente nos valores" (Rios, 1999, p. 24).

De acordo com Klein Filho (2000, p. 21), "a partir de 1824, inúmeros
flagelos caíram sucessivamente sobre a população cearense".

"A esperança é um urubu pintado de verde" (Quintana, 2013, p. 58).
```

#### Citação indireta

```
Conforme Sordi e Ludke (2009), a Avaliação Institucional Participativa (AIP)
é uma alternativa para potencializar a adesão dos agentes da escola.

A Avaliação Institucional Participativa (AIP) é uma alternativa para
potencializar a adesão dos agentes da escola a projetos de qualificação
do ensino (Sordi; Ludke, 2009).
```

#### Citação de citação

```
"Um texto é citado para ser interpretado ou para apoio a uma interpretação"
(Eco, 1983, p. 121 apud Koche, 2009, p. 147).

Paulino et al. (2003 apud Andrade et al., 2010) exprimem que o tipo de
suplemento depende da composição química do pasto.
```

#### 3.1.1.1 — Autor pessoa física

```
(Miranda, 2006, p. 106)
De acordo com Miranda (2006, p. 106)
(Brasil, 2008, p. 2)
```

#### 3.1.1.2 — Autor pessoa jurídica

```
(Associação Brasileira de Criadores de Camarão, 2011, p. 5)
De acordo com a Associação Cearense dos Criadores de Camarão (2011)
(Fortaleza, 2008, p. 1)
(Brasil, cap. II, art. 77, parág. 1)
```

#### 3.1.1.3 — Dois autores

```
(Oliveira; Nunes, 2011, p. 103)
Conforme Oliveira e Nunes (2011, p. 103)
(UFC; UFPE, 2011)
Conforme Unesco e OPAS (2020)
```

#### 3.1.1.4 — Três autores

```
(Cruz; Perota; Mendes, 2000, p. 26)
Segundo Cruz, Perota e Mendes (2000, p. 26)
```

#### 3.1.1.5 — Mais de três autores

```
(Rocha; Dias; Mourão; Barbosa, 2021)
(Rocha et al., 2021, p. 198)
De acordo com Rocha et al. (2021, p. 198)
```

#### 3.1.1.6 — Mesmo sobrenome e data

```
(Ferreira, C., 2007, p. 20)
(Ferreira, L., 2007, p. 40)
De acordo com C. Ferreira (2007, p. 20)
De acordo com Luís Ferreira (2007, p. 20)
De acordo com Leandro Ferreira (2007, p. 40)
```

#### 3.1.1.7 — Mesmo autor, mesmo ano

```
(Chiavenato, 2008a, p. 150)
(Chiavenato, 2008b, p. 39)
Segundo Chiavenato (2008a, p. 150)
(Chiavenato, 2008a, 2008b)
```

#### 3.1.1.8 — Mesmo autor, anos distintos

```
(Rudio, 2002, 2003, 2007)
Conforme Rudio (2002, 2003, 2007)
```

#### 3.1.1.9 — Vários autores simultâneos

```
(Ferreira, 2006; Silva, 2007)
(Fonseca, 2007; Paiva, 2005; Silva, 2006)
```

#### 3.1.2 — Sem indicação de responsabilidade

```
(Acrefino, 1993, p. 1)
(Tribunal [...], 2011)
(O túnel [...], 2005, p. 5)
```

#### Ênfase (grifo)

```
Duarte (2008, p. 16, grifo nosso) define estudos de usuários como
"[...] uma investigação que objetiva identificar e caracterizar os
interesses, as necessidades e os hábitos de uso de informação".

"Embora seja necessário conhecermos nossos inimigos, não é isso que
nos dará vitória em nossas batalhas" (Gandolfo, 2021, local. 6, grifo próprio).
```

#### Tradução

```
"A biodança é uma postura filosófica, uma proposta educacional e uma
metodologia de conteúdos." (Toro, 2006, p. 43, tradução nossa).
```

---

### NOTAS DE RODAPÉ — Expressões latinas

#### Idem (Id.)
```
6  VIDAL, Maria de Fátima; GONÇALVES, Marcos Falcão. O segmento da pesca...
7  VIDAL; GONÇALVES, 2010, p. 4.
```

#### Ibidem (Ibid.)
```
9  ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS, 2002, p. 4.
10 Ibid., p. 7.
```

#### Opus citatum (op. cit.)
```
11 FERREIRA, 2006, p. 19.
12 LOUREIRO, 2004, p. 29-32.
13 FERREIRA, op. cit., p. 46.
```

#### Passim
```
15 OLIVEIRA, 2006, passim.
```

#### Loco citato (loc. cit.)
```
16 NASCIMENTO; CASTRO, 2010, p. 33-40.
17 PEREIRA, 2017, p. 15.
18 NASCIMENTO; CASTRO, loc. cit.
```

#### Conferre (Cf.)
```
19 Cf. SANTOS, 2009.
```

#### Sequentia (et seq.)
```
20 MOURA, 2011, p. 22 et seq.
```

#### apud
```
"Um texto é citado para ser interpretado ou para apoio a uma interpretação"
(Eco, 1983, p. 121 apud Koche, 2009, p. 147).
```

---

## Referências da API do Zotero

- Documentação oficial: https://www.zotero.org/support/dev/client_coding/javascript_api
- Rich text em títulos: https://www.zotero.org/support/kb/rich_text_bibliography
- Template base: https://github.com/windingwind/zotero-plugin-template
- Scaffold: https://github.com/northword/zotero-plugin-scaffold
