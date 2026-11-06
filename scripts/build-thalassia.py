from pathlib import Path
import json,re,subprocess
root=Path(__file__).resolve().parents[1]
subprocess.run(['python3',str(root/'scripts/compile-region.py'),'--thalassia'],check=True)
world_html=subprocess.check_output(['pandoc','-f','markdown','-t','html5','--wrap=none'],input=(root/'docs/mundo.md').read_text(),text=True)
(root/'data/world-politics.json').write_text(json.dumps({'title':'Povos e soberanias','html':world_html},ensure_ascii=False,indent=2)+'\n')
p=root/'data/thalassia.json';d=json.loads(p.read_text());source=json.loads((root/'data/thalassia-source.json').read_text())
for profile,person in zip(d['courtProfiles'],source['people']):
 profile.update(zone=person['zone'],stage=person['stage'],role=person['role'])
 for ability,art in zip(profile['abilities'],person['arts']):
  ability.update(matrix=art['matrix'],damageType=art['damageType'],baseDamage=art['damage'],damageFormulas=list(dict.fromkeys(re.findall(r'\b\d+d\d+\b',art['damage']+' '+art['effect']))))
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
p=root/'docs/bestiario.md';s=p.read_text();a=s.index('## 03 · Thalassia {#thalassia}');b=s.index('## 04 · Aéria {#aeria}',a)
body=(root/'docs/thalassia.md').read_text().split('\n',1)[1];body=re.sub(r'^(#{2,5}) ',lambda m:'#'+m[1]+' ',body,flags=re.M)
s=s[:a]+'## 03 · Thalassia {#thalassia}\n\n[Consultar Thalassia, seus três tronos e quinze fichas](/mundo/thalassia).\n\n'+body+'\n\n'+s[b:]
# The political concordance belongs to the chapter overview, not a seventh continent.
s=re.sub(r'<!-- geopolitics:start -->.*?<!-- geopolitics:end -->','',s,flags=re.S)
world=(root/'docs/mundo.md').read_text().split('\n',1)[1];world=re.sub(r'^#{2,5} ',lambda m:'#'+m[0],world,flags=re.M)
where=s.index('## ');s=s[:where]+'<!-- geopolitics:start -->\n'+world+'\n<!-- geopolitics:end -->\n\n'+s[where:];p.write_text(s)
