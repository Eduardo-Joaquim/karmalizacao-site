import re
DAMAGE={'Kármico':['1d10','2d6','2d8','2d10','3d10'],'Elemental':['1d10','2d6','2d8','2d10','3d10'],'Divino':['1d8','1d10','2d6','2d8','3d8'],'Marcial':['1d8','1d10','2d6','2d8','3d8'],'Corrupto':['1d10','2d8','3d6','3d8','3d12']}
OLD=['1d6','1d12','2d10','2d12','3d10']
def matrix(source):
 s=source.lower()
 if re.search('corrupt|enxerto|marca|mutaç',s):return 'Corrupto'
 if re.search('divin|comunhão|liturg|milagre',s):return 'Divino'
 if re.search(r'element|água|fogo|terra|\bar\b|luz|treva|sangue|heliose|plasma|combustão|gelo',s):return 'Elemental'
 if re.search('marcia|punho|espada|luta|pugil|pontaria',s):return 'Marcial'
 return 'Kármico'
def profile(source,grade):
 m=matrix(source);i=['I','II','III','IV','V'].index(grade) if grade in ['I','II','III','IV','V'] else 0
 return {'matrix':m,'damageType':'Físico' if m=='Marcial' else 'Kármico','baseDamage':DAMAGE[m][i]}
def adapt_damage(text,grade,m):
 if grade not in ['I','II','III','IV','V']:return text
 i=['I','II','III','IV','V'].index(grade)
 # Only the original offensive base changes; healing, shields and paid extra dice keep their construction.
 pattern=r'(?<![\w+])'+re.escape(OLD[i])+r'(?![\w+])(?=(?:\*\*|</strong>)?\s*(?:de )?dano|(?:\*\*|</strong>)?\s*(?:físico|kármico|elemental|divino|corrupto|de (?:impacto|Ar|Fogo|Água|Terra|Luz|Trevas|plasma|corte|perfuração)))'
 return re.sub(pattern,DAMAGE[m][i],text,flags=re.I)
