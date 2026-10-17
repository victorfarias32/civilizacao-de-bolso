# Civilização de Bolso

Uma pequena sociedade. As regras que você escolhe. Uma história que chega ao fim.

**Primeira versão jogável implementada — 0.1.0.** Inclui simulação local, diorama 2D, políticas, ambiente, gerações, eventos, crônica, dois destinos, salvamento e PWA. Publicação e limitações estão em [PUBLICACAO.md](docs/PUBLICACAO.md).

## Jogar

[**Abrir o jogo**](https://civilizacao-de-bolso-victor.espa-o-de-tr-2071.chatgpt.site) — versão pública no Sites; abre sem login no ChatGPT.

Funde uma comunidade de 12 pessoas, escolha políticas e avance as estações. A simulação começa pausada. Use **Retomar**, **+ Estação** e velocidades 1×/2×/4×. Observe as fichas dos habitantes, o ambiente e a crônica; trabalho e extração intensivos trazem benefícios imediatos e custos acumulados.

O cenário acompanha até 40 anos (160 estações). Pode terminar antes por extinção; sobreviventes ao final deixam o legado dos fundadores. A crônica e o epílogo usam fatos da partida, sem IA externa. Não há backend de jogo nem progresso enquanto o aplicativo está fechado.

O menu **Partida** permite salvar, importar e exportar JSON. O salvamento é automático e local ao domínio/navegador. Exporte histórias importantes; o navegador pode apagar dados locais. Após o primeiro carregamento completo, o aplicativo usa cache para funcionar offline.

## Desenvolver pelo celular

Use um ambiente Node na nuvem acessado pelo navegador Android; não é necessário instalar terminal no telefone. O repositório pode ser aberto em um serviço compatível com desenvolvimento remoto. Custos e limites desse serviço são separados da execução local do jogo.

Requisitos: Node 24 LTS e npm.

```sh
npm ci
npm run dev
```

Abra a prévia na porta 5173 com caminho `/civilizacao-de-bolso/`. Em ambiente remoto, use a URL encaminhada pelo serviço, não o localhost do telefone.

```sh
npm run typecheck
npm test
npm run balance
npm run build
npm run preview
```

Para testes de navegador:

```sh
npx playwright install chromium
npm run test:e2e
```

Se houver Chromium do sistema: `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`.

## Validação

24 testes de simulação/intercâmbio, 20 testes Playwright em desktop e perfil Android emulado, análise Axe dos quatro painéis e lote de 80 partidas. [Evidências e limitações](docs/validacao/RELEASE-v0.1.md).

**Android físico ainda precisa de avaliação:** instalação real, leitor de tela, desempenho e retomada após encerrar o Chrome. Emulação não substitui esse aceite. Destinos cósmicos, pesquisa extensa, facções e multiplayer continuam fora desta versão.

## Documentação

- [Design do jogo](docs/GDD.md)
- [Especificação](docs/SPEC.md) e [regras da simulação](docs/specs/SIMULACAO.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Plano de ação](docs/ACAO.md) e [tarefas com estado/evidências](docs/tasks/README.md)
- [Validação](docs/specs/VALIDACAO.md) e [relatório da versão](docs/validacao/RELEASE-v0.1.md)
- [Contribuição](CONTRIBUTING.md) e [arte/licenças](docs/ARTE-E-LICENCAS.md)

## Publicação

A build é estática. GitHub Pages tem workflow preparado para o subdiretório `/civilizacao-de-bolso/`, mas a integração recusou sua ativação administrativa (HTTP 403). A versão já está publicada no Sites como alternativa, com acesso público, sem login. Para hospedar na raiz em outro serviço, use `npm run build -- --base=/` e publique `dist/` por HTTPS. Não é necessário servidor próprio.

## Licença

[MIT](LICENSE) para código e arte original. Avisos de dependências em [THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt).
