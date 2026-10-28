from pathlib import Path
import subprocess,re
root=Path(__file__).resolve().parents[1]
subprocess.run(['python3',str(root/'scripts/build-elven-gaeria.py'),'--aeria'],check=True)
p=root/'docs/bestiario.md';s=p.read_text();a=s.index('## 04 · Aéria {#aeria}');b=s.index('## 05 · As duas cortes {#cortes}',a)
body=(root/'docs/corte-demi-humana-aeria.md').read_text().split('\n',1)[1]
body=re.sub(r'^(#{2,5}) ',lambda m:'#'+m[1]+' ',body,flags=re.M)
p.write_text(s[:a]+'''## 04 · Aéria {#aeria}

Celestária, Miravéu e Ferravento unem tratados, resgate e indústria. A Corte dos Céus Abertos reúne Sael Aruven, a herdeira Maelis e as casas que respondem pelas rotas.

[Consultar a Corte Demi-Humana de Aéria](/mundo/aeria/corte-demi-humana).

'''+body+'\n\n'+s[b:])

subprocess.run(['python3',str(root/'scripts/build-elven-gaeria.py'),'--nidavellir'],check=True)
p=root/'docs/bestiario.md';s=p.read_text();body=(root/'docs/republica-nidavellir.md').read_text().split('\n',1)[1]
body=re.sub(r'^(#{2,5}) ',lambda m:'#'+m[1]+' ',body,flags=re.M)
s=s.replace('## 05 · As duas cortes {#cortes}', '[Consultar Nidavellir e seus cinco governantes](/mundo/aeria/nidavellir).\n\n'+body+'\n\n## 05 · As duas cortes {#cortes}')
p.write_text(s)
