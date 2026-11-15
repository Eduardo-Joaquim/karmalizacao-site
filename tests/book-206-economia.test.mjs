import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Compile an isolated fixture through the real equipment compiler. This catches
// dollar-delimited mathematics swallowing currency cells across Markdown rows.
const fixture = spawnSync('python3', ['-c', String.raw`
from pathlib import Path
from tempfile import TemporaryDirectory
import json, shutil, subprocess
from lxml import html
root = Path.cwd()
with TemporaryDirectory() as name:
    tmp = Path(name)
    for relative in ['scripts/build-equipment.py', 'docs/equipamentos-tecnologia.md', 'data/rules.json', 'data/equipment-mechanics.json']:
        target = tmp / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / relative, target)
    subprocess.run(['python3', str(tmp / 'scripts/build-equipment.py')], check=True, capture_output=True, text=True)
    book = json.loads((tmp / 'data/rules.json').read_text())
    catalog = json.loads((tmp / 'data/equipment-catalog.json').read_text())
    result = {'catalog': {item['id']: item['price'] for item in catalog}, 'chapters': {}}
    for number in [17, 20]:
        item = next(item for item in book['chapters'] if item['number'] == number)
        tree = html.fragment_fromstring(item['html'], create_parent='div')
        result['chapters'][str(number)] = {
            'text': tree.text_content(),
            'math': len(tree.xpath('.//span[contains(@class, "math")]')),
            'tables': {
                table.xpath('.//tr[1]/th[1]')[0].text_content(): [
                    [cell.text_content() for cell in row.xpath('./td')]
                    for row in table.xpath('.//tbody/tr')]
                for table in tree.xpath('.//table') if table.xpath('.//tr[1]/th[1]')
            },
        }
    print(json.dumps(result, ensure_ascii=False))
`], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
assert.equal(fixture.status, 0, fixture.stderr);
const compiled = JSON.parse(fixture.stdout);

test('equipment compiler preserves all load bands and ammunition cells with literal currency', () => {
  const equipment = compiled.chapters['17'];
  const technology = compiled.chapters['20'];
  assert.equal(equipment.math, 0);
  assert.equal(technology.math, 0);
  assert.deepEqual(equipment.tables.Faixa.map(row => row[0]), [
    'Leve ou Ágil', 'Confortável', 'Sobrecarregado', 'Crítica', 'Imobilizante',
  ]);
  assert(equipment.tables.Faixa.every(row => row.length === 4));
  const ammunition = technology.tables['Munição ou recipiente'];
  assert.equal(ammunition.length, 12);
  assert(ammunition.every(row => row.length === 7));
  assert.deepEqual(ammunition.find(row => row[0] === 'Carregador de pistola abastecido'), [
    'Carregador de pistola abastecido', 'Licenciado', '5', 'Inclui recipiente e munição',
    '1/3', '—', '8 disparos; remanescente do lote fica separado',
  ]);
  assert.match(equipment.text, /preços deste capítulo usam a moeda de Meridian, abreviada como M\$/);
  assert.match(equipment.text, /estabilizante, de 1 M\$/);
  assert.match(equipment.text, /Catalisador kármico, de 6 M\$/);
  assert.match(equipment.text, /arredondado para cima, mínimo 2 M\$/);
  assert.match(equipment.text, /3 TE e 10 M\$ de materiais/);
  assert.match(equipment.text, /8 × 0,75 = 6 M\$/);
  assert.match(equipment.text, /Preço \(M\$\)/);
  assert.doesNotMatch(equipment.text, /mínimo [12] M\$; [−-][13] CA/);
});

test('short preparation times and focus prices follow the final authorial values', () => {
  const synthesis = compiled.chapters['17'].tables.Potência;
  assert.deepEqual(synthesis.map(row => row[3]), [
    '15 minutos de trabalho', '30 minutos de trabalho', '60 minutos de trabalho',
  ]);
  assert.equal(compiled.catalog['luvas-canalizadoras'], '18');
  assert.equal(compiled.catalog['lanterna-astral'], '22');
  assert.equal(compiled.catalog['correntes-de-selamento'], '25');
  assert.match(compiled.chapters['17'].text, /preparo fora de combate dura de 5 a 15 minutos/);
  assert.doesNotMatch(compiled.chapters['17'].text, /TE corresponde a aproximadamente 30 minutos|meio TE equivale a 15 minutos/);
});

test('the rejection example retains both chemical damage and its movement penalty', () => {
  const text = compiled.chapters['17'].text;
  assert.match(text, /Damião[\s\S]*sofre 2d6 de dano químico pelo excesso de 2 pontos e fica Envenenado/);
  assert.match(text, /perde a Ação de Movimento desse próximo turno/);
  assert.match(text, /1d6 de dano químico por ponto acima do limiar/);
  assert.doesNotMatch(text, /sofre [23]d8 químico interno/);
});

test('technology distinguishes complete evasion from blocking a degree', () => {
  const text = compiled.chapters['20'].text;
  assert.match(text, /Evasão que supera a referência evita completamente essa incidência/);
  assert.match(text, /Bloqueio reduz o grau do ataque/);
  assert.doesNotMatch(text, /Evasão ou Bloqueio reduz o grau|Evasão reduz o grau do efeito/);
});
