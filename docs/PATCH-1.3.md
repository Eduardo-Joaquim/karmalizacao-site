# Karmalização — Patch 1.3

Este patch reúne a reescrita didática dos Votos Vinculativos, a criação de Invocações na página 4, retratos persistentes e links públicos revogáveis para fichas. As regras numéricas dos Votos não foram alteradas.

## 1. Votos Vinculativos sem ambiguidade

O capítulo 16 passou de cerca de 2.238 para mais de 3.700 palavras e ganhou uma tabela de referência. Livro e criador seguem a mesma ordem de sete passos:

1. Resumir o desejo em uma frase, sem escolher números.
2. Escrever a renúncia antes de definir o benefício mecânico.
3. Classificar o Peso olhando apenas para a perda real.
4. Receber automaticamente a Potência correspondente.
5. Escolher um único pacote da linha do Peso ou de linha inferior.
6. Conferir separadamente a gravidade da renúncia e o teto do benefício.
7. Obter aprovação, pagar Karma, testar e registrar a selagem.

Peso mede a gravidade da renúncia. Potência não é moeda, bônus, dano, CA nem Karma: é somente o teto da categoria de benefício. Não se somam pacotes até gastar 1, 3, 7, 15 ou 31. A única combinação prevista continua sendo a permissão expressa do Peso 5. Custos, CDs, espaços, consequências e o sacrifício especial de quatro pontos permanecem iguais.

## 2. Criador de Invocações

A página 4 ganhou uma seção vinculada ao Capítulo 15 e ao índice lateral. Cada registro comporta:

- imagem, nome, natureza, Grau, perfil e forma de chamada;
- Desejo, Serviço, Limite, Preço, Sinal, Comando, dissipação, fraqueza e Fraturas;
- Atributo principal, dois secundários, duas Perícias principais e uma fraca;
- movimento, sentidos e traço sensorial ou estético;
- habilidade própria com Grau, conceito, cálculo, efeito e limites.

CA, Vida, dano, Deslocamento, custo de chamada e manutenção são calculados pela linha do Grau. Um único perfil pode modificar esses valores: Guardião, Predador, Batedor ou Resistente. Projeção, Fusão e Âncora também aplicam seus ajustes. Fusão fica indisponível abaixo do Grau III e a habilidade não pode superar o Grau da criatura. O site mostra advertências para combinações incompatíveis sem inventar aprovação narrativa.

Fichas antigas recebem `invocations: []` durante a normalização e continuam válidas. O limite de armazenamento é dez pactos, correspondente ao máximo publicado para Conjuração 5.

## 3. Imagens do personagem e das Invocações

O jogador pode selecionar PNG, JPG ou WebP na etapa 1 e em cada Invocação. O navegador reduz dimensões e qualidade antes da gravação. Apenas formatos raster seguros são aceitos; SVG e conteúdo remoto não são incorporados. Cada imagem codificada possui limite de 180.000 caracteres, e a ficha completa possui limite de 2,2 milhões de caracteres.

As imagens ficam dentro do JSON da própria ficha. Assim, acompanham a persistência e a página compartilhada sem depender de hospedagem externa. A escolha evita migração de banco e preserva fichas existentes, mas significa que muitas imagens deixam a resposta da ficha maior; por isso há compressão e limites estritos.

## 4. Compartilhamento somente leitura

Na página 5, o proprietário pode criar um link público, copiar o endereço, gerar outro token ou desativar o compartilhamento. O endereço combina o identificador aleatório da ficha e um token aleatório separado. A página pública consulta o registro pelo identificador, confirma que o compartilhamento continua habilitado e compara o token antes de renderizar.

O link exibe o retrato, valores, habilidades, poderes, Invocações, Votos, técnicas, notas e inventário presentes na ficha salva. Ele não envia o e-mail do proprietário, não oferece controles de edição e não chama as rotas autenticadas de gravação. Gerar outro token invalida o endereço anterior após salvar; desativar o compartilhamento faz o endereço retornar como não encontrado.

A página recebe diretiva de não indexação para reduzir descoberta acidental por mecanismos de busca. Ainda assim, trata-se de um link público: qualquer pessoa que receba o endereço pode repassá-lo. Nenhuma informação secreta deve ser colocada numa ficha compartilhada.

## 5. Compatibilidade e segurança

- Nenhuma migração SQL: imagens, Invocações e estado de compartilhamento são campos opcionais do payload versionado.
- Normalização retrocompatível para fichas anteriores.
- Validação no cliente e no servidor para formato, tamanho de imagem, número de Invocações e token.
- O link é revogável e nunca concede acesso de escrita.
- A conta proprietária continua sendo exigida para listar, salvar ou excluir personagens.
- Invocações vazias não aparecem na página 5.
- A visualização pública não mostra controles de inventário.

## 6. Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `components/invocation-editor.tsx` | Editor completo das Invocações na página 4 |
| `lib/invocation-rules.ts` | Bases, perfis, formas e avisos de compatibilidade |
| `components/image-uploader.tsx` | Validação, redução e remoção de imagens |
| `components/character-sheet-view.tsx` | Retratos, Invocações e modo público somente leitura |
| `app/ficha/[id]/[token]/page.tsx` | Página pública protegida por token revogável |
| `components/character-builder.tsx` | Upload do retrato e controles de compartilhamento |
| `lib/character-data.ts` | Tipos, valores iniciais e migração de payloads antigos |
| `lib/character-schema.ts` | Limites e validação no servidor |
| `scripts/vow_chapter_content.py` | Texto canônico e tabela do capítulo 16 |
| `scripts/patch-rulebook.py` | Geração reproduzível do Word atualizado |

## 7. Verificações exigidas

Antes de salvar uma versão publicável, executar o conjunto automatizado de testes, ESLint dos arquivos alterados, build de produção, conferência estrutural do livro on-line e renderização visual do Word. O compartilhamento real também depende de o site permanecer público; o patch não modifica sozinho a política de acesso existente.
