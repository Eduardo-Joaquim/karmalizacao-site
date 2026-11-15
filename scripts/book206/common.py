"""Small, strict helpers for the 2.0.6 editorial transformations."""
from lxml import html as html_parser


def chapter(book, number):
    return next(item for item in book['chapters'] if item['number'] == number)


def replace(item, old, new, required=True):
    if new in item['html']:
        return
    if old in item['html']:
        item['html'] = item['html'].replace(old, new)
    elif new not in item['html'] and required:
        raise ValueError(f"Chapter {item['number']}: missing source text {old[:100]!r}")


def append_section(item, section_id, title, body):
    tree = html_parser.fragment_fromstring(item['html'], create_parent='div')
    for existing in tree.xpath('//*[@data-book206-section=$key]', key=section_id):
        existing.getparent().remove(existing)
    # Some specialized compilers round-trip Markdown and discard <section>
    # attributes while retaining the heading ID and its content. Replace that
    # prior body too, without consuming unrelated paragraphs after the section.
    body_nodes = html_parser.fragments_fromstring(body)
    body_count = sum(not isinstance(node, str) for node in body_nodes)
    for heading in tree.xpath('.//h2[@id=$key]', key=section_id):
        following = list(heading.itersiblings())
        for node in following[:body_count]:
            if node.tag in ('h1', 'h2'):
                break
            node.getparent().remove(node)
        heading.getparent().remove(heading)
    item['html'] = ''.join(html_parser.tostring(node, encoding='unicode') for node in tree)
    item['html'] += f'<section data-book206-section="{section_id}"><h2 id="{section_id}">{title}</h2>{body}</section>'
