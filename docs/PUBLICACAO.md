# Publicação e operação

Estado: primeira versão jogável publicada com sucesso em 17/10/2026 às 10:29 UTC.

Jogo: https://civilizacao-de-bolso-victor.espa-o-de-tr-2071.chatgpt.site

Audiência: privada, preservando o acesso original da conta do titular. O código permanece público no GitHub.

Deploy confirmado pelo Sites: appgdep_6ad34ddaf2fc81919a4710e5aa980306.
Versão: appgprj_6ad34caa6d888191a2e31215878b1c8d~appgver_94a2f94e12cc81919912651b1475ac49.
Commit de origem da hospedagem: b6ef983aff60205f399591f7fac5891b30984735.
Commit principal da implementação no GitHub: 24d53bd72c3f4d3be8c738755a8715c17a26a028.

O deploy usa build estática na raiz (`--base=/`) do mesmo código, com arquivo tar correspondente ao commit de origem enviado.

## GitHub Pages

O workflow `.github/workflows/pages.yml` instala pelo lockfile, verifica tipos, testes, build e navegador e gera um artefato estático. A tentativa de habilitar Pages via API retornou HTTP 403: Resource not accessible by integration. Isso é limitação de permissão da integração, não falta de código.

Se o titular escolher Pages posteriormente: Settings → Pages → Source: GitHub Actions; executar manualmente o workflow Publicar jogo. Para deploy automático a cada push, definir a variável de repositório PUBLISH_GITHUB_PAGES=true depois de habilitar Pages. Não é necessário fornecer senha ou token à conversa. A base Vite já é `/civilizacao-de-bolso/`.

## Sites

Identidade persistida em `.openai/hosting.json`; não criar outro Site para esta versão. Manter a audiência privada original até uma mudança explícita. O repositório GitHub continua sendo a fonte pública do projeto; a hospedagem só serve os arquivos estáticos.

Build na raiz: `npm run build -- --base=/`. Publicar exatamente o código enviado ao repositório de origem Sites e o arquivo de build correspondente. Credenciais de publicação são temporárias e não podem ser gravadas no repositório ou em arquivos.

## Dados do jogador

Salvamentos pertencem ao domínio e perfil do navegador. Exportar JSON antes de mudar de hospedagem. A execução é local; nenhuma conta é necessária para as regras do jogo, embora o provedor de hospedagem privada possa exigir acesso do titular.

## Recuperação

Se uma atualização falhar, manter o aplicativo aberto, exportar a partida e tentar novamente. Atualizações normais avisam e aguardam o botão Guardar e atualizar. Não limpar dados do navegador sem exportar histórias importantes.
