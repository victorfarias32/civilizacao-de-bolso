# Plano de ação — da especificação à v0.1

Estado: primeira versão jogável implementada e verificada automaticamente. Ver [tarefas](tasks/README.md) e [relatório](validacao/RELEASE-v0.1.md) para evidências e pendências.

## Resultado e fronteira

Entregar uma partida pequena, bonita e finita: cerca de 12 habitantes iniciais, três políticas, recursos e ambiente, eventos com causas, duas eras, dois destinos, crônica factual, salvamento e PWA.

Não expandir para destinos cósmicos antes de validar essa experiência.

## Ordem de execução

| Marco | Tarefas | Resultado verificável |
| --- | --- | --- |
| M1 — Núcleo vivo | T01–T11 | Uma decisão altera uma comunidade observável |
| M2 — Comunidade | T12–T16 | Ambiente, abrigos, políticas e gerações interagem |
| M3 — História finita | T17–T21 | Extinção e legado encerram partidas e explicam a trajetória |
| M4 — Continuidade | T22–T25 | Recuperação, intercâmbio, instalação e offline |
| M5 — Publicação | T26–T30 | Experiência revisada, documentada e disponível em HTTPS |

O [índice das tarefas](tasks/README.md) contém dependências e acesso a cada pacote. As tarefas de fechamento T11, T16, T21, T25 e T30 impedem avançar com um marco apenas aparente.

## Fluxo de trabalho pelo celular

1. Abrir o repositório e a conversa pelo Android.
2. Implementar a primeira tarefa cujas dependências estejam concluídas, em ambiente de desenvolvimento na nuvem.
3. Gerar prévia acessível pelo navegador, registrar URL e versão quando disponíveis.
4. Executar testes automáticos no ambiente; documentar o que exige o aparelho real.
5. Verificar por toque no Android e corrigir falhas.
6. Salvar mudanças no GitHub e atualizar tarefa/índice com evidências.
7. Passar à próxima tarefa sem pedir confirmação para decisões técnicas rotineiras já autorizadas.

Não presumir que instalar o conector GitHub configura credenciais Git no terminal. A conexão atual permite editar o repositório; execução de Node, prévias e deploy precisam ser verificados no ambiente quando a implementação começar.

## Tecnologias e publicação recomendadas

React + TypeScript + Vite, Canvas 2D e Vitest. IndexedDB no M4. Usar vite-plugin-pwa no M4 para geração do service worker, precache e atualização sob controle; a dependência deve justificar esses recursos, sem instalar agora.

Recomendar GitHub Pages para a primeira hospedagem estática, aproveitando o repositório existente. Preparar base /civilizacao-de-bolso/ e workflow em T29. Confirmar disponibilidade e configuração reais antes de anunciar URL ou deploy. Não introduzir backend para publicar.

Escolher Node LTS suportado e fixar major compatível em T01; registrar versão no repositório e CI. Não escolher uma versão antiga por memória de exemplos.

## Regra de conclusão

Concluir uma tarefa significa satisfazer seus critérios, verificar efeitos relacionados e anexar evidência. Prototipagem visual, passagem isolada de build e existência de documento não substituem simulação funcional.

Se uma dependência externa bloquear, registrar motivo, tentativa e próximo passo; continuar tarefas independentes. Não contornar bloqueios de rede nem declarar testes inexistentes.

Atualizar o estado real no README a cada marco. Não confundir esta entrega de planejamento com jogo implementado.

## Decisões adotadas como hipóteses

40 anos / 160 estações; 10 segundos por estação em 1×; mapa 12×12; limite 60 vivos; políticas enumeradas; um slot atual e uma cópia anterior; importação até 5 MiB. [Regras](specs/SIMULACAO.md) e [validação](specs/VALIDACAO.md) definem detalhes.

Ajustar balanceamento com registro de evidências. Alterações de escopo devem atualizar especificação, tarefas e critérios juntos.

## Riscos concretos e resposta

- Simulação difícil de entender: explicar atividade, déficit e causas na ficha/crônica.
- Política sempre superior: comparar cenários reproduzíveis nos portões de marco.
- Arte bonita sem jogo: construir o núcleo testável antes dos efeitos.
- Perda de dados locais: transação, cópia anterior e exportação.
- Atualização PWA interrompe partida: não ativar automaticamente durante execução.
- Desempenho móvel: medir com população máxima e reduzir desenho antes de mudar stack.
- Escopo cresce: lista pós-v0.1 separada, sem entrar na fila de entrega atual.

## Próxima ação concreta

Validar a versão publicada em Android físico e resolver as pendências registradas no relatório. T01–T25 já possuem implementação e verificações automatizadas.
