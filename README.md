# Karmalização

Livro de regras, Bestiário e criação de fichas de Karmalização. O projeto usa React, TypeScript, Vinext/Vite e Cloudflare D1 na hospedagem.

## Executar

Use Node.js 22.15 ou superior. No Windows, execute os scripts pelo WSL2/Ubuntu; os scripts de build usam Bash e GNU timeout.

```bash
npm ci
npm run dev
```

Abra o endereço exibido no terminal. O livro, o Bestiário e a criação em modo visitante podem ser consultados sem login. O rascunho de visitante fica no armazenamento local do navegador; salve ou exporte antes de trocar de computador.

```bash
npm run check
# Ou, separadamente: tipos/lint, build e só então testes
npm run build
npm test
npm run start
```

`npm test` executa as verificações atuais de regras, fichas, catálogo, autenticação, interface e recursos de mesa. `npm run test:legacy` conserva as verificações históricas da versão 1.2; seus resultados não representam a matemática atual. Os testes usam execução sequencial para evitar competição entre instâncias do Vite.

## Conteúdo

As páginas estão em `app/`, os componentes em `components/` e as regras executáveis em `lib/`. `docs/` contém manuscritos, `data/` contém os dados usados pelo site e `scripts/` contém os geradores. `tests/` reúne as verificações.

`npm run content:build` regenera o conteúdo editorial. A geração editorial e os testes de catálogo requerem Python 3, Pandoc e lxml (`python3 -m pip install -r requirements-dev.txt`). Executar o site com os JSON já versionados não exige essas ferramentas. `scripts/compile-region.py` é o compilador compartilhado das cortes; `data/compiler-regions.json` registra as regiões. Os comandos antigos continuam como entradas de compatibilidade.

`data/equipment-mechanics.json` registra as propriedades dos equipamentos por identificador estável. O identificador acompanha o item no manuscrito. Mudar seu nome de exibição preserva a mecânica; mudar a carga exige atualizar a tabela e o registro correspondente. Divergências interrompem a geração, em vez de alterar a regra silenciosamente.

`data/size-rules.json` e `docs/porte.md` definem o porte. As fontes de Corrupção, equipamentos e alquimia continuam separadas para preservar o texto canônico dos capítulos.

## Hospedagem e dados

Configure `SITE_ORIGIN` no ambiente do servidor para usar outro domínio; `NEXT_PUBLIC_SITE_ORIGIN` é um fallback opcional. Sem configuração, o projeto usa o endereço oficial já publicado.

Salvar na nuvem e compartilhar fichas exige a integração de identidade da hospedagem e um banco D1 com as migrações de `drizzle/`. O modo visitante não contorna a autenticação das APIs. Cabeçalhos de identidade devem ser fornecidos apenas por um proxy confiável, nunca por entradas do navegador.

Os retratos novos são reduzidos para até 512 px e cerca de 48 KB; imagens antigas continuam aceitas no limite anterior. O salvamento verifica o tamanho real em UTF-8. Este repositório não contém credenciais nem registros privados dos jogadores.

Detalhes do ambiente original estão em `docs/HOSPEDAGEM.md`. As decisões da revisão de interface, regras e arquitetura estão em `docs/AUDITORIA-2026-10-28.md`.

## Qualidade e lançamentos

`npm run check` executa tipos, lint, build e testes nessa ordem. `npm run format:check` verifica as fontes manuais. Os testes que leem `dist` exigem o build atual. A integração contínua aplica essa sequência em checkout limpo.

O registro técnico do patch 2.0.5 fica em `docs/PATCH-2.0.5-TECNICO.md`; o histórico exibido aos jogadores contém somente mudanças de uso.
