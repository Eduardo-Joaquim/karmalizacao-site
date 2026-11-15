"""Normalize visible editorial separators without changing canonical identifiers.

Source manuscripts retain the punctuation used by their structural compilers.
This final presentation pass runs on generated HTML and its search text, and on
the rulebook before the shared Markdown/Word export is produced.
"""
from html import unescape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = (
    'rules', 'bestiary', 'court-sheets', 'gaeria', 'elven-gaeria',
    'vampire-ignaria', 'demon-ignaria', 'ghoul-ignaria', 'lunaviel-ignaria',
    'demi-aeria', 'nidavellir', 'thalassia', 'world-politics',
)
DISPLAY_FIELDS = {
    'title', 'shortTitle', 'label', 'sheetLabel', 'identity', 'description',
    'overviewText', 'searchableText', 'text', 'chanceSuccessLabel',
    'chanceFailureLabel',
}
STRONG = re.compile(
    r'(?P<open><strong\b[^>]*>)(?P<body>.*?)</strong>'
    r'(?P<period>\.)?(?P<space>\s*)', re.I | re.S,
)
TAGS = re.compile(r'<[^>]*>')
MIDDLE_DOT = re.compile(r'\s+·\s+')
# A short emphasized sentence is still a sentence. The pass is deliberately
# conservative: nominal labels change, assertions and instructions keep stops.
CLAUSE = re.compile(
    r'\b(?:não|nunca|sempre|é|são|será|serão|era|eram|foi|foram|está|estão|'
    r'pode|podem|deve|devem|precisa|precisam|exige|exigem|possui|possuem|'
    r'causa|causam|recebe|recebem|sofre|sofrem|concede|concedem|permite|permitem|'
    r'funciona|funcionam|mantém|mantêm|medem|continua|continuam|acrescenta|'
    r'reduz|reduzem|aumenta|aumentam|aplica|aplicam|usa|usam|rola|rolam|'
    r'escolha|reconheça|registre|descreva|determine|confirme|desenvolva|dê)\b',
    re.I,
)


def plain(value):
    return re.sub(r'\s+', ' ', unescape(TAGS.sub(' ', value))).strip()


def is_nominal_label(value):
    value = value.strip()
    if not value or len(value) > 110 or len(value.split()) > 12:
        return False
    initial = value.lstrip('“"«‘')[:1]
    if not initial or not initial.isupper():
        return False
    if re.search(r'[.!?;:\n]|https?://|\b\d+\.\d+', value):
        return False
    if value.casefold() == 'precisa':
        return True  # Named weapon property, not the verb in "precisa fazer".
    return not CLAUSE.search(value)


def middle_dots(value):
    """Replace typographic separators, preserving arithmetic such as 2 · 3."""
    def replace(match):
        left = value[:match.start()].rstrip()
        right = value[match.end():].lstrip()
        if left and right and left[-1].isdigit() and right[0].isdigit():
            return match[0]
        return ' - '
    return MIDDLE_DOT.sub(replace, value)


def visible_middle_dots(markup):
    """Touch text nodes only; code, attributes, links and anchors stay exact."""
    parts = re.split(r'(<[^>]*>)', markup)
    protected = []
    for index, part in enumerate(parts):
        if index % 2:
            closing = re.match(r'</\s*(code|pre|script|style)\b', part, re.I)
            opening = re.match(r'<\s*(code|pre|script|style)\b', part, re.I)
            if closing and protected and protected[-1] == closing[1].lower():
                protected.pop()
            elif opening and not part.endswith('/>'):
                protected.append(opening[1].lower())
        elif not protected:
            parts[index] = middle_dots(part)
    return ''.join(parts)


class EditorialNormalizer:
    def __init__(self):
        self.contexts = {}

    def html(self, markup):
        def replace(match):
            body = match['body']
            text = plain(body)
            inside = text.endswith('.')
            if not inside and not match['period']:
                return match[0]
            label = text[:-1].rstrip() if inside else text
            if not is_nominal_label(label):
                return match[0]
            prefix = markup[:match.start()]
            blocks = list(re.finditer(r'<(?:p|li|td|th|div|h[1-6]|br)\b[^>]*>', prefix, re.I))
            if blocks and plain(prefix[blocks[-1].end():]):
                return match[0]
            after = markup[match.end():]
            # There must be an actual description in the same block. A bold
            # standalone name or a number at the end of a cell is not a label.
            if not after or re.match(r'</(?:p|li|td|th|div|h[1-6])\b', after, re.I):
                return match[0]
            following = plain(after.split('</p>', 1)[0])[:64]
            if not following:
                return match[0]
            if inside:
                body = re.sub(r'\.(?=(?:\s|</[^>]+>)*$)', '', body, count=1)
            old = text + ('.' if match['period'] else '') + ' ' + following
            new = label + ' - ' + following
            self.contexts[old] = new
            return match['open'] + body.rstrip() + '</strong> - '
        protected = re.compile(r'<(pre|code|script|style)\b[^>]*>.*?</\1>', re.I | re.S)
        def replace_with_offset(match, offset):
            # Re-match on the full input so the description starts at the
            # original offset even when protected examples precede the label.
            original = STRONG.match(markup, match.start() + offset)
            return replace(original)
        pieces = []
        position = 0
        for block in protected.finditer(markup):
            # Preserve indexes used for the following-text context above.
            segment = markup[position:block.start()]
            if position:
                prefix = markup[:position]
                revised = STRONG.sub(lambda m: replace_with_offset(m, len(prefix)), segment)
            else:
                revised = STRONG.sub(replace, segment)
            pieces.extend((visible_middle_dots(revised), block[0]))
            position = block.end()
        if position:
            pieces.append(visible_middle_dots(STRONG.sub(lambda m: replace_with_offset(m, position), markup[position:])))
            return ''.join(pieces)
        return visible_middle_dots(STRONG.sub(replace, markup))

    def text(self, value):
        # Match a label together with the start of its actual description. Do
        # not blindly replace a noun at the end of an ordinary sentence.
        for old, new in self.contexts.items():
            value = value.replace(old, new)
        return middle_dots(value)

    def generated(self, data):
        def html_pass(value):
            if isinstance(value, dict):
                return {key: self.html(item) if isinstance(item, str)
                        and (key == 'html' or key.endswith('Html'))
                        else html_pass(item) for key, item in value.items()}
            if isinstance(value, list):
                return [html_pass(item) for item in value]
            return value

        def text_pass(value, field=None):
            if isinstance(value, dict):
                result = {key: text_pass(item, key) for key, item in value.items()}
                if 'html' in result and 'searchableText' in result:
                    result['searchableText'] = plain(result['html'])
                    if 'wordCount' in result:
                        result['wordCount'] = len(result['searchableText'].split())
                return result
            if isinstance(value, list):
                return [text_pass(item, field) for item in value]
            if isinstance(value, str) and field in DISPLAY_FIELDS:
                return self.text(value)
            return value
        return text_pass(html_pass(data))


def normalize_chapter(chapter):
    normalizer = EditorialNormalizer()
    chapter['html'] = normalizer.html(chapter['html'])
    for field in ('title', 'shortTitle', 'description', 'overviewText'):
        if isinstance(chapter.get(field), str):
            chapter[field] = normalizer.text(chapter[field])


def main():
    changed = []
    for name in OUTPUTS:
        path = ROOT / 'data' / (name + '.json')
        if not path.exists():
            continue
        data = json.loads(path.read_text())
        revised = EditorialNormalizer().generated(data)
        if revised != data:
            path.write_text(json.dumps(revised, ensure_ascii=False, indent=2) + '\n')
            changed.append(name)
    print('Separadores editoriais: ' + (', '.join(changed) if changed else 'saídas já padronizadas') + '.')


if __name__ == '__main__':
    main()
