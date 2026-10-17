# Contribuir

Use Node 24 LTS e npm. Clone o repositório, execute `npm ci` e `npm run dev`. Abra o endereço exibido com o caminho `/civilizacao-de-bolso/`.

Leia [SPEC](docs/SPEC.md), [regras](docs/specs/SIMULACAO.md) e a tarefa correspondente. Simulação não deve importar DOM, React, Canvas, relógio real ou serviços externos. Resultados probabilísticos usam o PRNG do estado; registrar mudanças de regras e balanceamento.

Antes de enviar: `npm run typecheck`, `npm test`, `npm run balance`, `npm run build`. Para navegador, execute `npx playwright install chromium` e `npm run test:e2e`; no ambiente com Chromium do sistema, use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`.

Mantenha lockfile, licenças e documentação. Não inclua salvamentos pessoais, tokens, node_modules ou dist. Registre o que foi testado e o que permanece pendente. Testes em viewport emulado não equivalem a uso em Android real.

Para reportar falhas, informe versão, navegador, passos e, quando quiser, uma partida exportada sem informações pessoais no nome da comunidade. A semente sozinha não reproduz decisões diferentes.
