"""Build a compact index of NPC-only outorgas from the Bestiary source."""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def slug(text):
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', normalized).strip('-')


def build_blessing_index(bestiary):
    world = json.loads((ROOT / 'data/world-blessings.json').read_text())
    extras = json.loads((ROOT / 'data/bestiary-blessing-extras.json').read_text())
    source = bestiary['html']
    by_id = {entry['id']: entry for entry in world}
    markers = set(re.findall(r'data-world-blessing="([^"]+)"', source))
    if markers != set(by_id):
        raise ValueError(f'Outorgas do Bestiário divergentes: {sorted(markers ^ set(by_id))}')
    records = [by_id[key] for key in by_id if key in markers] + extras
    for entry in records:
        if entry.get('disponivelParaPlayer') is not False or entry.get('categoriaAcesso') not in ('hereditaria_linhagem', 'unica_bestiario'):
            raise ValueError(f"Outorga exclusiva sem bloqueio: {entry['name']}")
        if slug(entry['name']) not in slug(bestiary['searchableText']):
            raise ValueError(f"Outorga exclusiva não encontrada no Bestiário: {entry['name']}")
    catalog = json.loads((ROOT / 'data/pantheon-blessings.json').read_text())
    restricted = {slug(name) for entry in records for name in [entry['id'], entry['name'], *entry.get('aliases', [])]}
    open_grants = [b for p in catalog for d in p['deities'] for b in d['blessings']]
    for blessing in open_grants:
        if blessing.get('categoriaAcesso') != 'catalogo_player' or blessing.get('disponivelParaPlayer') is not True:
            raise ValueError(f"Bênção sem outorga aberta: {blessing['title']}")
        if slug(blessing['title']) in restricted:
            raise ValueError(f"Bênção de NPC no catálogo aberto: {blessing['title']}")
    (ROOT / 'data/bestiary-blessing-index.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    return records
