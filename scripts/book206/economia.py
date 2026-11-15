"""Check the generated equipment chapters against their approved source tables."""
from lxml import html

from .common import chapter


def apply(book):
    """Equipment has its own source compiler; do not duplicate its manuscript here."""
    equipment = chapter(book, 17)
    technology = chapter(book, 20)
    for item, header, rows in (
        (equipment, 'Faixa', 5),
        (technology, 'Munição ou recipiente', 12),
    ):
        tree = html.fragment_fromstring(item['html'], create_parent='div')
        tables = [table for table in tree.xpath('.//table')
                  if table.xpath('.//tr[1]/th[1]')
                  and table.xpath('.//tr[1]/th[1]')[0].text_content() == header]
        if len(tables) != 1 or len(tables[0].xpath('.//tbody/tr')) != rows:
            raise ValueError(f'Chapter {item["number"]}: malformed {header} table')
        if tables[0].xpath('.//span[contains(@class, "math")]'):
            raise ValueError(f'Chapter {item["number"]}: currency parsed as mathematics')
