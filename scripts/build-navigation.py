"""Compact routing metadata; never send regional prose just to resolve a hash."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
routes=[]
for name in ['demon-ignaria','ghoul-ignaria','lunaviel-ignaria','demi-aeria','nidavellir','thalassia','vampire-ignaria','elven-gaeria']:
 data=json.loads((root/f'data/{name}.json').read_text())
 routes.extend({'anchor':anchor,'url':data['url']} for anchor in data['anchors'])
anchors=json.loads((root/'data/gaeria-anchors.json').read_text())
routes.extend({'anchor':anchor,'url':'/mundo/gaeria/reino-humano'} for anchor in anchors)
source=json.loads((root/'data/thalassia-source.json').read_text())
(root/'data/navigation-index.json').write_text(json.dumps({'routes':routes,'thalassiaZones':source['zones']},ensure_ascii=False,indent=2)+'\n')
