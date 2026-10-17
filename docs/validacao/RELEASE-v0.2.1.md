# Validação — 0.2.1

Escopo: classificar escolhas pela cor do maior ganho e ampliar a transformação do mapa. Regras 0.2.0 e formato de salvamento 2 preservados.

## Entregue

- Cartões com cor, nome e ícone da influência principal; ganhos secundários e prévia de estágio, pontuação e paisagem.
- Classificação considera o ganho efetivo até 100. Empates mostram as duas cores; influência saturada exibe ganho zero.
- Seis bairros que modificam o solo, os caminhos, a arquitetura das casas e os espaços públicos. A área cresce continuamente com os pontos, inclusive entre marcos.
- Mercados e passarelas do porto, oficinas e instrumentos, jardins e árvores, círculos de cristais, praça organizada e memoriais.
- Monumentos a partir de 72 pontos, efeitos ambientes e realce temporário da região afetada. Movimento reduzido preservado.
- Um marco permanente por decisão resolvida e recibo visível do resultado junto ao mundo. As influências anteriores continuam combinadas.

## Verificação

- Build TypeScript/Vite aprovada. JavaScript principal aproximadamente 140 KiB gzip.
- 42 testes unitários aprovados. Novos casos verificam classificação pelo ganho real e consistência das seis cores.
- 34 testes de navegador aprovados em execução completa. Desktop e Android emulado verificam as seis classificações, empate, saturação, contraste com Axe, ausência de overflow e alterações reais no Canvas.
- Comparação de mapas com a mesma semente/estação: cada influência inicial altera mais de 700 pixels, um investimento de 12 para 18 muda mais de 300 pixels e o estágio 72 altera mais de 1.500 pixels em relação ao estágio 12. Os números são um limiar de verificação, não uma avaliação estética universal.
- A medição encontrou crescimento discreto no porto entre investimentos; o mercado recebeu mais passarelas e bancas antes da validação final.
- Cenas combinadas e oito cenários finais vivos continuam distintos. Extinção, estações, salvamento, importação, offline e atualização do PWA permanecem cobertos pela suite completa.

Capturas selecionadas foram inspecionadas visualmente e estão em [Direção visual](../DIRECAO-VISUAL.md). São cenários preparados para verificação. Não houve teste físico em Android. Não foram acrescentados sistemas econômicos de comércio ou pesquisa, nem dependências de execução.
