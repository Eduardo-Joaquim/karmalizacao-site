"""Compile Elaranth into a structured regional reader."""
from pathlib import Path
import json
import re
import subprocess
import sys

from lxml import etree as E
from lxml import html as LH

from skill_panels import skill_panel

root = Path(__file__).resolve().parents[1]
vampires = "--vampires" in sys.argv
extensions = {
    "--nidavellir": {"source":"docs/republica-nidavellir.md", "file":"data/nidavellir.json", "title":"Nidavellir · República das Quatro Cidades", "slug":"nidavellir", "url":"/mundo/aeria/nidavellir", "characters":["eirik-malm","oren-damar","haldor-rusk","saira-namar","idris-khar"], "counts":[9,7,7,7,7]},
    "--aeria": {"source":"docs/corte-demi-humana-aeria.md", "file":"data/demi-aeria.json", "title":"Aéria · Corte dos Céus Abertos", "slug":"corte-demi-humana", "url":"/mundo/aeria/corte-demi-humana", "characters":["rainha-sael","princesa-maelis","duque-darian","marquesa-iren","marques-torren","condessa-octavia","baronesa-otilia"], "counts":[10,6,4,3,3,3,3]},
    "--demons": {"source":"docs/corte-demoniaca-ignaria.md", "file":"data/demon-ignaria.json", "title":"Aqueronte · Corte Demoníaca de Ignária", "slug":"corte-demoniaca", "url":"/mundo/ignaria/corte-demoniaca", "characters":["rainha-valac","princesa-belial","princesa-astaroth","princesa-asmodeus","princesa-bael","duque-agares","marques-andras","marquesa-marchosias"], "counts":[10,6,6,6,6,5,3,3]},
    "--ghouls": {"source":"docs/ghouls-ignaria.md", "file":"data/ghoul-ignaria.json", "title":"Os Pretendentes Ghouls de Ignária", "slug":"ghouls", "url":"/mundo/ignaria/ghouls", "characters":["al-aqwa","candidata-sahar","candidata-naima","candidata-zahra"], "counts":[8,4,4,4]},
    "--lunaviel": {"source":"docs/casa-lunaviel-ignaria.md", "file":"data/lunaviel-ignaria.json", "title":"Casa Marquesal Lunaviel · Ignária", "slug":"casa-lunaviel", "url":"/mundo/ignaria/casa-lunaviel", "characters":["caroline-lunaviel","valentino-heathcliff","alaric-voss"], "counts":[8,3,5]},
}
extension = next((value for flag,value in extensions.items() if flag in sys.argv), None)
source_path = "docs/corte-vampirica-ignaria.md" if vampires else "docs/reino-elfico-gaeria.md"
if extension:
    source_path = extension["source"]
source = (root / source_path).read_text()
body = source.split("\n", 1)[1]
rendered = subprocess.check_output(
    ["pandoc", "-f", "markdown", "-t", "html5"], input=body, text=True
)
soup = LH.fragment_fromstring(rendered, create_parent="div")
text = lambda node: "".join(node.itertext())
render = lambda node: LH.tostring(node, encoding="unicode")

characters = [
    "rainha-naerith",
    "princesa-ilyra",
    "duque-thaerion",
    "caelen-solvarden",
]
if vampires:
    characters = ["rainha-nosferato", "princesa-alucard", "princesa-savia", "marquesado-dorne", "marquesado-kessel", "condado-senn", "viscondado-kost"]
if extension:
    characters = extension["characters"]

for heading in list(soup.findall("h3")):
    if heading.get("id") not in characters:
        continue
    article = E.Element(
        "article",
        {"class": "elven-dossier", "aria-labelledby": heading.get("id")},
    )
    heading.addprevious(article)
    node = heading
    while node is not None:
        following = node.getnext()
        if node is not heading and node.tag in ["h2", "h3"]:
            break
        article.append(node)
        node = following

    stats = next(
        (p for p in article.findall("p") if text(p).startswith("Identidade:")), None
    )
    assert stats is not None
    raw = re.sub(r"\s+", " ", text(stats)).strip()

    def capture(label, end):
        match = re.search(label + r":\s*(.*?)" + end, raw)
        assert match, (label, raw)
        return match[1]

    identity = capture("Identidade", r"\. Vida:")
    life = int(capture("Vida", r"\. Karma:"))
    karma_end = r"\. Pontos Corruptos:" if "Pontos Corruptos:" in raw else r"\. CA:"
    karma = int(capture("Karma", karma_end))
    pc = (
        int(capture("Pontos Corruptos", r"\. CA:"))
        if "Pontos Corruptos:" in raw
        else None
    )
    ca = int(capture("CA", r"\. Deslocamento:"))
    movement = capture("Deslocamento", r"\. Atributos:")
    attrs = []
    for chunk in raw.split("Atributos:", 1)[1].strip().rstrip(".").split(" · "):
        name, value = chunk.rsplit(" ", 1)
        attrs.append({"name": name, "value": int(value)})

    vitals = E.Element("dl", {"class": "elven-vitals-source"})
    for label, value in [
        ("Identidade", identity),
        ("Vida", str(life)),
        ("Karma", str(karma)),
        *([("Pontos Corruptos", str(pc))] if pc is not None else []),
        ("CA", str(ca)),
        ("Deslocamento", movement),
    ]:
        item = E.SubElement(vitals, "div")
        E.SubElement(item, "dt").text = label
        E.SubElement(item, "dd").text = value
    stats.addprevious(vitals)
    attrs_node = E.Element("dl", {"class": "elven-attributes-source"})
    for attr in attrs:
        item = E.SubElement(attrs_node, "div")
        E.SubElement(item, "dt").text = attr["name"]
        E.SubElement(item, "dd").text = str(attr["value"])
    article.replace(stats, attrs_node)

    for ability in list(article.findall("h5")):
        card = E.Element("section", {"class": "elven-ability-source"})
        ability.addprevious(card)
        node = ability
        while node is not None:
            following = node.getnext()
            if node is not ability and node.tag in ["h2", "h3", "h4", "h5"]:
                break
            card.append(node)
            node = following


def field_nodes(paragraph):
    fields = []
    label = ""
    parts = []
    if paragraph.text:
        parts.append(paragraph.text)
    for child in paragraph:
        if child.tag == "strong" and text(child).strip().endswith(":"):
            if parts:
                fields.append({"label": label, "html": "".join(parts)})
            label = text(child).rstrip(":")
            parts = [child.tail or ""]
        else:
            parts.append(LH.tostring(child, encoding="unicode", with_tail=True))
    if parts:
        fields.append({"label": label, "html": "".join(parts)})
    return fields


profiles = []
for article in soup.xpath('.//article[@class="elven-dossier"]'):
    heading = article.find("h3")
    name, title = text(heading).split(" · ", 1)
    h4s = article.findall("h4")
    assert len(h4s) == 2
    lore = []
    node = h4s[0].getnext()
    while node is not None and node is not h4s[1]:
        lore.append(render(node))
        node = node.getnext()

    vitals = {
        item.find("dt").text: item.find("dd").text
        for item in article.find('dl[@class="elven-vitals-source"]')
    }
    attrs = [
        {"name": item.find("dt").text, "value": int(item.find("dd").text)}
        for item in article.find('dl[@class="elven-attributes-source"]')
    ]
    facts = []
    abilities = []
    node = h4s[1].getnext()
    while node is not None:
        if node.tag == "p":
            facts.append({"fields": field_nodes(node)})
        if node.tag == "section":
            ability_heading = node.find("h5")
            heading_text = re.sub(r"\s+", " ", text(ability_heading))
            if heading_text.startswith("Reação ·"):
                kind = "reaction"
            elif heading_text.startswith("Assinatura ·"):
                kind = "signature"
            else:
                kind = "technique"
            name_text = re.sub(
                r"^(?:\d+|Reação|Assinatura) · ", "", heading_text
            )
            full_text = re.sub(r"\s+", " ", text(node))
            source_match = re.search(r"Fonte e Grau:\s*(.*?)\s+(?:V|IV|III|II|I)\b", full_text)
            grade_match = re.search(r"\b(V|IV|III|II|I)\b", full_text)
            cost_match = re.search(
                r"(\d+)\s+(Karma|Pontos Corruptos)", full_text
            )
            action = (
                "Reação"
                if re.search(r"Uso:\s*Reação", full_text) or kind == "reaction"
                else "Movimento"
                if re.search(r"Uso:\s*Movimento", full_text)
                else "Livre"
                if re.search(r"Uso:\s*Livre", full_text)
                else "Extra"
                if re.search(r"Uso:\s*Extra", full_text)
                else "Principal"
            )
            abilities.append(
                {
                    "id": ability_heading.get("id"),
                    "name": name_text,
                    "kind": kind,
                    "source": source_match[1] if source_match else "",
                    "grade": grade_match[1] if grade_match else "",
                    "cost": (
                        f"{cost_match[1]} {'PC' if cost_match[2].startswith('Pontos') else 'Karma'}"
                        if cost_match
                        else "—"
                    ),
                    "action": action,
                    "fields": [
                        field
                        for paragraph in node.findall("p")
                        for field in field_nodes(paragraph)
                    ],
                }
            )
        node = node.getnext()

    profiles.append(
        {
            "id": heading.get("id"),
            "name": name,
            "title": title,
            "loreId": h4s[0].get("id"),
            "combatId": h4s[1].get("id"),
            "sheetLabel": text(h4s[1]),
            "loreHtml": "".join(lore),
            "identity": vitals["Identidade"],
            "life": int(vitals["Vida"]),
            "karma": int(vitals["Karma"]),
            "pc": int(vitals["Pontos Corruptos"])
            if "Pontos Corruptos" in vitals
            else None,
            "ca": int(vitals["CA"]),
            "movement": vitals["Deslocamento"],
            "attributes": attrs,
            "facts": facts,
            "abilities": abilities,
        }
    )

for article in soup.xpath('.//article[@class="elven-dossier"]'):
    for paragraph in list(article.findall("p")):
        if text(paragraph).startswith("Perícias:"):
            panel = skill_panel(text(paragraph))
            assert panel is not None
            article.replace(paragraph, panel)

navigation = []
for heading in soup.xpath(".//h3[@id]"):
    if heading.get("id") in characters:
        full = re.sub(r"\s+", " ", text(heading))
        name, _, title = full.partition(" · ")
        navigation.append({"id": heading.get("id"), "name": name, "title": title})

sections = []
for heading in soup.findall("h2"):
    nodes = []
    node = heading.getnext()
    while node is not None and node.tag != "h2":
        nodes.append(render(node))
        node = node.getnext()
    sections.append(
        {"id": heading.get("id"), "title": text(heading), "html": "".join(nodes)}
    )

ids = soup.xpath(".//@id")
assert len(ids) == len(set(ids))
assert len(profiles) == (len(extension["characters"]) if extension else 7 if vampires else 4)
assert [len(profile["abilities"]) for profile in profiles] == (extension["counts"] if extension else [8, 7, 4, 3, 3, 3, 3] if vampires else [11, 4, 5, 3])
if vampires:
    from collections import Counter
    assert Counter(a["source"] for a in profiles[0]["abilities"] if a["kind"] == "technique") == {"Elemental de Água": 1, "Subdobra de Sangue": 3, "Karma": 2, "Marcial": 1}
if not extension:
    assert len(profiles[0]["facts"]) >= 5
    assert ("2 Reações por rodada" if vampires else "3 Reações por rodada") in re.sub(r"\s+", " ", text(soup))
intro_nodes = list(soup)[: list(soup).index(soup.find("h2"))]
data = {
    "title": "Sárkora · Corte Vampírica de Ignária" if vampires else "Elaranth · Reino Élfico de Gaéria",
    "slug": "corte-vampirica" if vampires else "reino-elfico",
    "url": "/mundo/ignaria/corte-vampirica" if vampires else "/mundo/gaeria/reino-elfico",
    "introHtml": "".join(render(node) for node in intro_nodes),
    "html": "".join(render(node) for node in soup),
    "sections": sections,
    "characterIds": characters,
    "courtProfiles": profiles,
    "navigation": navigation,
    "anchors": ids,
}
if extension:
    data.update({key:extension[key] for key in ["title","slug","url"]})
(root / (extension["file"] if extension else "data/vampire-ignaria.json" if vampires else "data/elven-gaeria.json")).write_text(
    json.dumps(data, ensure_ascii=False, indent=2) + "\n"
)
print(f'{data["title"]}: {len(profiles)} fichas; {sum(len(p["abilities"]) for p in profiles)} técnicas.')
