# Publicação e operação

Estado: código implementado e testado; publicação Sites em andamento. O endereço só deve ser anunciado como funcional após confirmação do deploy.

## GitHub Pages

O workflow `.github/workflows/pages.yml` instala pelo lockfile, verifica tipos, testes, build e navegador e gera um artefato estático. A tentativa de habilitar Pages via API retornou HTTP 403: Resource not accessible by integration. Isso é limitação de permissão da integração, não falta de código.

Se o titular escolher Pages posteriormente: Settings → Pages → Source: GitHub Actions; executar o workflow Publicar jogo. Não é necessário fornecer senha ou token à conversa. A base Vite já é `/civilizacao-de-bolso/`.

## Sites

Identidade persistida em `.openai/hosting.json`; não criar outro Site para esta versão. Manter a audiência privada original até uma mudança explícita. O repositório GitHub continua sendo a fonte pública do projeto; a hospedagem só serve os arquivos estáticos.

Build na raiz: `npm run build -- --base=/`. Publicar exatamente o código enviado ao repositório de origem Sites e o arquivo de build correspondente. Credenciais de publicação são temporárias e não podem ser gravadas no repositório ou em arquivos.

## Dados do jogador

Salvamentos pertencem ao domínio e perfil do navegador. Exportar JSON antes de mudar de hospedagem. A execução é local; nenhuma conta é necessária para as regras do jogo, embora o provedor de hospedagem privada possa exigir acesso do titular.

## Recuperação

Se uma atualização falhar, manter o aplicativo aberto, exportar a partida e tentar novamente. Atualizações normais avisam e aguardam o botão Guardar e atualizar. Não limpar dados do navegador sem exportar histórias importantes.
