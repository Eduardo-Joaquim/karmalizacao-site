"""Compile the vampire court and integrate its manuscript into the bestiary."""
from pathlib import Path
import re
import subprocess

root = Path(__file__).resolve().parents[1]
subprocess.run(["python3", str(root / "scripts/build-elven-gaeria.py"), "--vampires"], check=True)
sources = ["docs/corte-vampirica-ignaria.md", "docs/corte-demoniaca-ignaria.md", "docs/ghouls-ignaria.md", "docs/casa-lunaviel-ignaria.md"]
for flag in ["--demons", "--ghouls", "--lunaviel"]:
    subprocess.run(["python3", str(root / "scripts/build-elven-gaeria.py"), flag], check=True)
body = "\n\n".join((root / source).read_text().split("\n", 1)[1] for source in sources)
regional = re.sub(r"^(#{2,5}) ", lambda m: "#" + m[1] + " ", body, flags=re.M)
path = root / "docs/bestiario.md"
book = path.read_text()
start = book.index("## 01 · Ignária {#ignaria}")
end = book.index("## 02 · Gaéria {#gaeria}")
section = """## 01 · Ignária {#ignaria}

Forjas, rios quentes e cidades protegidas pela pedra. Sárkora abriga a Corte Haimaton; Aqueronte recebe a dinastia Lucifero. Entre as comunidades ghouls, o trono permanece vago.

**Monstros locais:** o catálogo de criaturas ainda não possui verbetes.

**Organizações e nobres:** Casa Ducal Agares; Casas Marquesais Dorne, Kessel, Andras, Marchosias e Lunaviel; Casa Condal Senn e Casa Viscondal Kost.

**Corte real:** Rainha Nosferato V. Drácula, Princesa Alucard e Princesa Sávia Vita.

[Consultar a Corte Vampírica de Ignária](/mundo/ignaria/corte-vampirica).

"""
path.write_text(book[:start] + section + regional + "\n\n" + book[end:])
