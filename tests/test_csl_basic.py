"""
Teste básico: verificar se citeproc-py consegue carregar o CSL da UFC
e gerar referências corretas para diferentes tipos.

Compara a saída do CSL com as referências da folha de respostas
(docs/referencias-ufc-exemplos.md).

A saída do citeproc-py é HTML — convertemos <b> para ** e <i> para *
para comparar com o formato markdown da folha.
"""

import os
import re
import sys
from citeproc import CitationStylesStyle, CitationStylesBibliography
from citeproc import Citation, CitationItem
from citeproc.source.json import CiteProcJSON

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSL_PATH = os.path.join(PROJECT_ROOT, "ufc.csl")


def html_to_markdown(html):
    """Converte HTML inline do citeproc-py para markdown."""
    text = html
    text = re.sub(r'<b>(.*?)</b>', r'**\1**', text)
    text = re.sub(r'<i>(.*?)</i>', r'*\1*', text)
    text = re.sub(r'<[^>]+>', '', text)  # remove qualquer tag restante
    text = " ".join(text.split())  # normaliza espaços
    return text.strip()


def render_bibliography(csl_path, items):
    """Renderiza a bibliografia usando citeproc-py e retorna lista de strings markdown."""
    bib_source = CiteProcJSON(items)
    bib_style = CitationStylesStyle(csl_path, validate=False)
    bibliography = CitationStylesBibliography(bib_style, bib_source)

    for item in items:
        citation = Citation([CitationItem(item["id"])])
        bibliography.register(citation)

    results = []
    for entry in bibliography.bibliography():
        html = str(entry)
        md = html_to_markdown(html)
        results.append(md)

    return results


# ========================================================================
# FIXTURES — dados CSL-JSON para cada referência de teste
# ========================================================================

TESTS = [
    # ---- 3.1.1.1 Livros e/ou folhetos no todo ----
    {
        "section": "3.1.1.1",
        "description": "Livro simples - 1 autor",
        "items": [{
            "id": "lessa2014",
            "type": "book",
            "title": "Cadê os operários?",
            "author": [{"family": "Lessa", "given": "Sérgio"}],
            "publisher": "Instituto Lukacs",
            "publisher-place": "São Paulo",
            "issued": {"date-parts": [[2014]]}
        }],
        "expected": "LESSA, Sérgio. **Cadê os operários?** São Paulo: Instituto Lukacs, 2014."
    },
    {
        "section": "3.1.1.1",
        "description": "Livro - 2 autores com edição",
        "items": [{
            "id": "marconi2004",
            "type": "book",
            "title": "Metodologia científica",
            "author": [
                {"family": "Marconi", "given": "Marina de Andrade"},
                {"family": "Lakatos", "given": "Eva Maria"}
            ],
            "edition": "4",
            "publisher": "Atlas",
            "publisher-place": "São Paulo",
            "issued": {"date-parts": [[2004]]}
        }],
        "expected": "MARCONI, Marina de Andrade; LAKATOS, Eva Maria. **Metodologia científica**. 4. ed. São Paulo: Atlas, 2004."
    },
    {
        "section": "3.1.1.1",
        "description": "Livro - 4 autores (com et al)",
        "items": [{
            "id": "farias2014",
            "type": "book",
            "title": "Didática e docência",
            "author": [
                {"family": "Farias", "given": "I. M. S."},
                {"family": "Sales", "given": "J. C. B."},
                {"family": "Braga", "given": "M. M. S. C."},
                {"family": "França", "given": "M. do S. L. M."}
            ],
            "edition": "4",
            "publisher": "Liber Livro",
            "publisher-place": "Brasília, DF",
            "issued": {"date-parts": [[2014]]}
        }],
        # Na folha há DUAS formas: com 4 autores e com et al.
        # O CSL usa et-al-min=4, então com 4 autores deve mostrar et al.
        "expected": "FARIAS, I. M. S. *et al*. **Didática e docência**. 4. ed. Brasília, DF: Liber Livro, 2014."
    },
    # ---- 3.1.2.1 Trabalhos acadêmicos ----
    {
        "section": "3.1.2.1",
        "description": "Tese de doutorado",
        "items": [{
            "id": "benegas2006",
            "type": "thesis",
            "title": "Três ensaios em análise econômica",
            "author": [{"family": "Benegas", "given": "M."}],
            "genre": "Tese (Doutorado em Economia)",
            "publisher": "Universidade Federal do Ceará",
            "publisher-place": "Fortaleza",
            "issued": {"date-parts": [[2006]]},
            "note": "Faculdade de Economia, Administração, Atuária e Contabilidade"
        }],
        "expected": "BENEGAS, M. **Três ensaios em análise econômica**. 2006. Tese (Doutorado em Economia) – Faculdade de Economia, Administração, Atuária e Contabilidade, Universidade Federal do Ceará, Fortaleza, 2006."
    },
    # ---- 3.3.7 Artigo de periódico ----
    {
        "section": "3.3.7",
        "description": "Artigo de periódico - básico",
        "items": [{
            "id": "hoffmann2006",
            "type": "article-journal",
            "title": "A autoridade e a questão do pai",
            "author": [{"family": "Hoffmann", "given": "C."}],
            "container-title": "Ágora: estudos em teoria psicanalítica",
            "publisher-place": "Rio de Janeiro",
            "volume": "9",
            "issue": "2",
            "page": "169-176",
            "issued": {"date-parts": [[2006, 7]]}
        }],
        "expected": "HOFFMANN, C. A autoridade e a questão do pai. **Ágora**: estudos em teoria psicanalítica, Rio de Janeiro, v. 9, n. 2, p. 169-176, jul./dez. 2006."
    },
    # ---- 3.5.1 Patente ----
    {
        "section": "3.5.1",
        "description": "Patente",
        "items": [{
            "id": "schroeder_patent",
            "type": "patent",
            "title": "Aparelho para servir bebidas e processo para converter um aparelho para servir bebidas",
            "author": [
                {"family": "Schroeder", "given": "Alfred A."},
                {"family": "Credle", "given": "William S."}
            ],
            "authority": "BR",
            "number": "PI 8706898-2 B1",
            "note": "Depositante: The Coca-Cola Company",
            "submitted": {"date-parts": [[1988, 3, 29]]},
            "issued": {"date-parts": [[1991, 10, 29]]}
        }],
        "expected": "SCHROEDER, Alfred A.; CREDLE, William S. **Aparelho para servir bebidas e processo para converter um aparelho para servir bebidas**. Depositante: The Coca-Cola Company. BR n. PI 8706898-2 B1. Depósito: 29 mar. 1988. Concessão: 29 out. 1991."
    },
]


def show_diff(result, expected):
    """Mostra diferenças entre resultado e esperado de forma legível."""
    if result == expected:
        return
    # Encontrar a primeira diferença
    min_len = min(len(result), len(expected))
    first_diff = min_len
    for i in range(min_len):
        if result[i] != expected[i]:
            first_diff = i
            break

    context = 20
    start = max(0, first_diff - context)
    end_r = min(len(result), first_diff + context)
    end_e = min(len(expected), first_diff + context)

    print(f"    Primeira diff na posição {first_diff}:")
    print(f"    Resultado: ...{result[start:end_r]}...")
    print(f"    Esperado:  ...{expected[start:end_e]}...")


def main():
    print(f"CSL: {CSL_PATH}\n")

    passed = 0
    failed = 0
    errors = []

    for test in TESTS:
        section = test["section"]
        desc = test["description"]
        expected = test["expected"]

        try:
            results = render_bibliography(CSL_PATH, test["items"])
            result = results[0] if results else "(vazio)"
        except Exception as e:
            result = f"ERRO: {e}"

        if result == expected:
            print(f"  ✓ [{section}] {desc}")
            passed += 1
        else:
            print(f"  ✗ [{section}] {desc}")
            print(f"    Resultado: {result}")
            print(f"    Esperado:  {expected}")
            show_diff(result, expected)
            failed += 1
            errors.append((section, desc, result, expected))

    print(f"\n{'='*60}")
    print(f"Total: {passed + failed} | Passou: {passed} | Falhou: {failed}")

    if errors:
        print(f"\nResumo dos problemas encontrados:")
        for section, desc, result, expected in errors:
            print(f"\n  [{section}] {desc}")
            # Categorizar o tipo de problema
            if "." in result.split(",")[0].split(" ")[1] if len(result.split(",")) > 0 and len(result.split(",")[0].split(" ")) > 1 else False:
                print(f"    → Possível: nome abreviado pelo citeproc-py")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
