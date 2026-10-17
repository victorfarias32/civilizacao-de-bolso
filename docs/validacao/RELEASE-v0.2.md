# Validação — 0.2.0

Data: 17/10/2026. Escopo: escolhas de conselho, nove destinos e paisagens combinadas.

## Implementado e verificado

- 19 temas de conselho com três alternativas, custos, efeitos materiais e seis influências.
- Oferta de conselho pausa a interface, sem escolha automática. Resolver aplica um comando determinístico e avança uma estação; adiar permite continuar.
- Sete destinos extraordinários, além de legado e extinção. Cada destino especial foi atingido em teste por uma partida com escolhas reais, sem injetar recursos ou pontos de influência.
- Projetos acumulam seis camadas, com detalhes híbridos. Os encerramentos têm tratamentos visuais próprios e preservam influências anteriores.
- Crônica com decisões e descobertas, epílogo com combinações, painel de requisitos reais e encerramento voluntário quando preparado.
- Salvamento em formato 2/regras 0.2.0; migração de partidas 0.1.0 sem apagar história ou recursos.

## Evidências

- `npm run typecheck` e `npm run build`: passaram. JavaScript principal aproximadamente 135 KiB gzip, PWA estática sem backend de jogo.
- `npm test`: 40 testes passaram. Incluem sete trajetórias especiais completas, determinismo com escolhas, rejeição de escolhas sem custo disponível ou repetidas, guarda de condições finais, congelamento após o fim, crônica híbrida e migração.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: 30 casos passaram em uma execução completa, em desktop e Pixel 7 emulado. Incluem conselho com pausa automática, persistência após recarregar, requisitos, cenários finais distintos e comparação de regiões de pixels para provar preservação de projetos nas misturas.
- Axe WCAG A/AA nos cinco painéis: nenhuma violação detectada nos dois perfis. Não substitui avaliação humana.
- `npm run destinies`: sete estratégias diagnosticadas até a estação 160. Caminhos podem preparar múltiplos finais, e o automático respeita a prioridade documentada. Os testes de trajetória escolhem explicitamente cada final assim que estiver elegível.

Capturas de cenários foram inspecionadas no navegador. Testes automatizados não substituem avaliação estética pelo titular. Android físico, leitor de tela real e balanceamento amplo com as novas decisões ainda precisam de avaliação. Não foi implementada uma árvore completa de pesquisa, todas as eras ou facções.

Especificação e condições exatas: [Destinos e paisagens](../DESTINOS.md).
