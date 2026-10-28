# Protótipo — 17/10/2026

Fonte: Karmalização - Prototipo, pasta RPG / Karmalização / Livros, arquivo 1Nc7o2YWP-u94_oiqVGn7yGs9LrdiHomY, modificado em 17/10/2026 14:46 UTC.

Conteúdo integral substituído: 20 capítulos, 16 classes, 9 raças. A importação conserva tabelas e textos das habilidades. Cálculos revistos: treinamento, reserva de testes, progressão comum e extras de classe, invocações, Domínios e Memória de uma Única Obra.

As ações de combate e a aprovação de requisitos narrativos continuam sendo resolvidas pela mesa; a ficha registra os resultados. A nova publicação possui identidade e banco próprios. O ZIP de origem não inclui fichas salvas no serviço antigo.

## Atualizar o conteúdo

Execute `node scripts/generate-rules.mjs /caminho/livro.docx` e `python3 scripts/import-prototype.py /caminho/livro.docx`. Os importadores atualizam o conteúdo; alterações em fórmulas exigem revisão de lib/character-rules.ts e lib/invocation-rules.ts. O script legado generate-character-rules.mjs atende apenas ao livro antigo.

Testes atuais: `npm test`. As suítes históricas character-rules e patch-1.2 documentam regras anteriores e não são critérios para o protótipo. TypeScript e build foram verificados; inspeção visual no navegador não foi executada neste ambiente.
