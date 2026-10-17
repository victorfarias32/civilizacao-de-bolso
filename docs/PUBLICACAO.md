# Publicação e operação

## Atualização 0.2.1 — cores e bairros

Publicada em 17/10/2026 às 11:51 UTC no mesmo endereço público. Sites versão 4, deploy `appgdep_6ad3614027848191b9486fc005cf1eb1` confirmado `succeeded`. Versão salva: `appgprj_6ad34caa6d888191a2e31215878b1c8d~appgver_f0eca4cc494c81918320118b4206c51c`. Origem Sites: `44c9eb0c90a5e6a3f5897f06b6b34b9fcfbf94bc`. Implementação GitHub: `7a30f85`.

Escolhas classificadas por cor do ganho efetivo, bairros com expansão contínua, arquitetura e monumentos. [Direção visual](DIRECAO-VISUAL.md) e [validação](validacao/RELEASE-v0.2.1.md). Regras e formato de salvamento preservados; usar **Guardar e atualizar** no aviso do PWA.

## Atualização 0.2.0 — escolhas e destinos

Publicada em 17/10/2026 às 11:23 UTC no mesmo endereço público. Versão Sites 3, deploy `appgdep_6ad35ab3a82c8191b3a8e970188a596a` confirmado `succeeded`. Versão salva: `appgprj_6ad34caa6d888191a2e31215878b1c8d~appgver_0bc1335a61088191b9b4d22465af5fb3`. Origem Sites: `3decabf367e6c28311b1c5eb536cba7115253dd2`. Implementação GitHub: `f0fc1ee`.

Inclui nove destinos, 19 conselhos e cenários combinados. [Especificação](DESTINOS.md) e [validação](validacao/RELEASE-v0.2.md). Partidas 0.1.0 são migradas; não é necessário apagar dados. Se houver atualização pendente no PWA, usar **Guardar e atualizar**.

## Revisão visual publicada

A revisão em pixel art foi publicada com sucesso em 17/10/2026 às 11:04 UTC, preservando o acesso público sem login.

- Commit de implementação no GitHub: 9c0a12a.
- Commit de origem Sites: ed64d0498279731aab51698896a5706ef1935e79.
- Versão Sites: appgprj_6ad34caa6d888191a2e31215878b1c8d~appgver_7ba9bc57aeac8191b296de99fcf2fc93.
- Deploy: appgdep_6ad35633bd148191a2300008053c8ef4, confirmado succeeded.
- [Direção visual, capturas e verificações](DIRECAO-VISUAL.md).

Se o navegador ainda estiver usando a versão anterior em cache, usar Guardar e atualizar quando o aplicativo avisar. Os salvamentos continuam compatíveis.

## Primeira publicação

Estado: primeira versão jogável publicada com sucesso em 17/10/2026 às 10:29 UTC.

Jogo: https://civilizacao-de-bolso-victor.espa-o-de-tr-2071.chatgpt.site

Audiência: pública desde 17/10/2026 às 10:35 UTC, por solicitação explícita do titular. Acesso anônimo verificado: HTTP 200, sem redirecionamento de login. O código permanece público no GitHub.

Deploy confirmado pelo Sites: appgdep_6ad34ddaf2fc81919a4710e5aa980306.
Versão: appgprj_6ad34caa6d888191a2e31215878b1c8d~appgver_94a2f94e12cc81919912651b1475ac49.
Commit de origem da hospedagem: b6ef983aff60205f399591f7fac5891b30984735.
Commit principal da implementação no GitHub: 24d53bd72c3f4d3be8c738755a8715c17a26a028.

O deploy usa build estática na raiz (`--base=/`) do mesmo código, com arquivo tar correspondente ao commit de origem enviado.

## GitHub Pages

O workflow `.github/workflows/pages.yml` instala pelo lockfile, verifica tipos, testes, build e navegador e gera um artefato estático. A tentativa de habilitar Pages via API retornou HTTP 403: Resource not accessible by integration. Isso é limitação de permissão da integração, não falta de código.

Se o titular escolher Pages posteriormente: Settings → Pages → Source: GitHub Actions; executar manualmente o workflow Publicar jogo. Para deploy automático a cada push, definir a variável de repositório PUBLISH_GITHUB_PAGES=true depois de habilitar Pages. Não é necessário fornecer senha ou token à conversa. A base Vite já é `/civilizacao-de-bolso/`.

## Sites

Identidade persistida em `.openai/hosting.json`; não criar outro Site para esta versão. O titular solicitou e autorizou a audiência pública. O repositório GitHub continua sendo a fonte pública do projeto; a hospedagem só serve os arquivos estáticos.

Build na raiz: `npm run build -- --base=/`. Publicar exatamente o código enviado ao repositório de origem Sites e o arquivo de build correspondente. Credenciais de publicação são temporárias e não podem ser gravadas no repositório ou em arquivos.

## Dados do jogador

Salvamentos pertencem ao domínio e perfil do navegador. Exportar JSON antes de mudar de hospedagem. A execução é local; nenhuma conta é necessária para as regras do jogo, e a hospedagem atual é pública, sem login no ChatGPT.

## Recuperação

Se uma atualização falhar, manter o aplicativo aberto, exportar a partida e tentar novamente. Atualizações normais avisam e aguardam o botão Guardar e atualizar. Não limpar dados do navegador sem exportar histórias importantes.
