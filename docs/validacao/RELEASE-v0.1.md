# Validação da primeira versão jogável — 0.1.0

Data: 17/10/2026. Estado: candidata jogável; aceite em aparelho Android físico pendente. Não é uma afirmação de que todas as ideias do GDD foram implementadas.

## O que existe

React/TypeScript/Vite, diorama Canvas 2D original, 12 habitantes iniciais, políticas de trabalho/distribuição/extração, necessidades, ambiente, madeira e abrigos com manutenção, nascimentos e mortes, eventos condicionados, duas tradições, duas eras, crônica, dois destinos e epílogo. Partidas têm até 160 estações. Salvamento IndexedDB com cópia anterior, importação/exportação validada, PWA offline e atualização consentida.

## Evidências executadas

- Node 24.19.0 e npm 11.9.0 no ambiente Linux de desenvolvimento.
- `npm run typecheck`: passou.
- `npm test`: 24 testes passaram, incluindo partidas normais que atingem legado e extinção, conservação de alimento, reprodução determinística, regras de idade, eventos, construção e validação de arquivos.
- `npm run balance`: 80 partidas completas, seeds 1–20, quatro estratégias. Resultados integrais em [balance.json](balance.json). Moderado/cuidadoso: 17 legados e 3 extinções. Intensivo/cuidadoso: 12 legados e 8 extinções. Extração acelerada mantida: 20 extinções. Estratégia adaptativa de trabalho: 17 legados e 3 extinções. Isso não prova equilíbrio universal; a extração acelerada é arriscada quando mantida.
- `npm run build`: passou; JavaScript principal aproximadamente 114 KiB gzip, abaixo da meta inicial de 300 KiB.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: 20 testes passaram, em desktop e perfil Pixel 7 emulado. Cobrem jogo por toque, políticas, fichas, exportação, retomada, importação inválida, dois finais, bloqueio após o fim, offline, pausa ao ocultar página, cópia anterior corrompida, falha de quota, atualização do service worker sem perda e acessibilidade dos quatro painéis.
- Axe WCAG A/AA: sem violações detectadas nos quatro painéis testados. Isso não equivale a auditoria humana completa ou teste com leitor de tela real.
- Viewport 360×640: sem overflow horizontal; cenário com 60 habitantes consultável. Canvas medido a 30 desenhos/s no navegador do ambiente, conforme [perfil móvel emulado](browser-android-emulado.json) e [desktop](browser-desktop.json). Isso não mede desempenho em telefone físico.
- A semente padrão 42, com políticas padrão, chegou ao legado no ciclo 160 com 10 sobreviventes.

## Ajustes de balanceamento

Os parâmetros originais causavam extinção inevitável antes do fim nas estratégias cuidadosas. A coleta-base de alimento foi ajustada para 440; a regeneração-base para 2000; reparos utilizam um trabalhador; a comunidade constrói quando falta uma vaga de reserva; nascimentos exigem quatro estações de excedente real (produção >= demanda + 60). Isso cria margem para manutenção e evita crescimento apoiado apenas em estoque antigo. Nenhum bônus de recurso invisível ou encerramento falso foi usado.

## Limites e pendências

- Verificar toque, instalação na tela inicial, leitor de tela e desempenho em um Android real. Não houve acesso a aparelho físico.
- Verificar vida útil do cache e abertura offline após encerramento completo do Chrome no Android.
- Nova hospedagem depende de controles da plataforma; GitHub Pages recusou ativação por falta de permissão da integração (HTTP 403). Workflow de deploy está pronto; Sites publicou a versão com sucesso; o titular depois autorizou acesso público. Endereço e identificação estão em [PUBLICACAO.md](../PUBLICACAO.md).
- Destinos cósmicos, pesquisa avançada, facções, multiplayer e progresso offline não fazem parte desta versão.
- Persistência é local ao domínio e navegador. Exportar JSON para transferir entre hospedagens.

## Licenças

Código e arte original: MIT. React, React DOM, Zod e Workbox com avisos em public/THIRD_PARTY_NOTICES.txt. Sem assets remotos obrigatórios.

## Publicação confirmada

O Sites confirmou sucesso da publicação em 17/10/2026 às 10:29 UTC: [abrir jogo](https://civilizacao-de-bolso-victor.espa-o-de-tr-2071.chatgpt.site). Acesso tornado público por solicitação do titular em 17/10/2026 às 10:35 UTC, com HTTP 200 anônimo e sem redirecionamento. Código público no GitHub. Build e testes da implementação estão concluídos; aceite em Android físico continua explícito.
