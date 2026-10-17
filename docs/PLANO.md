# Plano de implementação

Estado: implementação da primeira versão jogável realizada. As seções abaixo preservam o plano; o [índice das tarefas](tasks/README.md) e o [relatório](validacao/RELEASE-v0.1.md) distinguem entregas verificadas de aceite físico pendente.

Execução: [plano de ação](ACAO.md), [spec](SPEC.md), [regras](specs/SIMULACAO.md), [validação](specs/VALIDACAO.md) e [30 tarefas](tasks/README.md). Parâmetros operacionais da primeira versão foram detalhados nesses documentos como hipóteses testáveis.

## Marco 1 — Uma decisão com consequências

Objetivo: observar 12 habitantes e perceber como uma política altera a vida da comunidade.

Entregas:
- Projeto TypeScript, React e Vite com comandos documentados.
- Diorama pequeno com bosque, clareira e 12 habitantes nomeados.
- Estado determinístico e avanço por estação.
- Alimento disponível no ambiente, coleta, reserva e consumo.
- Fome, energia, saúde e recuperação em modelo mínimo.
- Política de trabalho moderado ou intensivo.
- Pausa, avanço manual e velocidades.
- Interface móvel com indicadores, inspeção de habitantes e crônica curta.
- Testes de regras essenciais.

Validação:
- A mesma condição inicial, semente e sequência de comandos produzem o mesmo estado.
- Trabalho intensivo ajuda na produção inicial e produz custo acumulado observável quando mantido.
- Alimento não se torna negativo e produção corresponde às regras, não à animação.
- Crônica relata consequências reais e não inventa causas.
- Nenhum controle essencial depende de mouse; uso validado em Android.
- Testes e construção passam; resultados e limitações ficam documentados.

Não incluir neste marco: reprodução, madeira, construção completa, tradições, eras avançadas, PWA ou todos os destinos. Abrigos de cenário, se desenhados, devem ser identificados como decorativos até a implementação do sistema.

## Marco 2 — Comunidade

Adicionar madeira, construção e manutenção de abrigos, condições ambientais, demografia, distribuição de alimento e extração cuidadosa/acelerada.

Validação:
- Políticas produzem trajetórias diferentes com causas identificáveis.
- Recursos, saúde e ambiente respeitam seus limites.
- Crescimento e redução populacional seguem condições documentadas.
- Alertas dão sinais úteis antes de crises graves.
- Desempenho permanece adequado no celular.

## Marco 3 — História finita

Adicionar poucos eventos condicionados, tradições ligadas à experiência, eras Sobrevivência e Comunidade e cenário A primeira geração.

Implementar extinção e legado dos fundadores ao término proposto de 40 anos. Gerar epílogo com fatos da crônica e permitir consultá-lo após o encerramento.

Validação:
- Ambas as condições de encerramento são alcançáveis.
- Partida encerrada não continua consumindo ou produzindo.
- Epílogo corresponde aos registros e distingue prosperidade de sobrevivência precária.
- Sinais e condições dos eventos tornam seus impactos compreensíveis.
- Ritmo e horizonte de 40 anos são avaliados como decisões de design, não tratados como números definitivos.

## Marco 4 — Continuidade

Adicionar salvamento em IndexedDB, formato versionado, exportação e importação JSON, manifesto e service worker.

Validação:
- Fechar e reabrir recupera o mesmo estado.
- Exportar e importar preserva resultados futuros sob as mesmas decisões.
- Arquivo inválido é rejeitado sem apagar a partida atual.
- Aplicativo funciona offline após instalação/carregamento dos recursos.
- Atualizações não interrompem uma partida ativa nem invalidam salvamentos silenciosamente.
- Sair para outro aplicativo pausa a simulação.

## Marco 5 — Primeira publicação

Revisar arte, efeitos, acessibilidade, desempenho, documentação e licenças. Escolher hospedagem estática e publicar uma versão identificada.

Validação:
- Partida completa executada em Android real.
- Controles por toque, textos, redução de movimento e sinais além da cor verificados.
- Testes e construção da versão passam.
- Instruções permitem desenvolver e publicar a partir de um ambiente acessível pelo celular.
- README descreve o que existe, limitações e como jogar.
- Licença do código definida e licenças dos recursos registradas.

## Depois da primeira versão

Priorizar novas camadas somente após validar o núcleo: cultura, instituições, tecnologias, crises complexas e destinos extraordinários. Não implementar simultaneamente todos os sistemas da visão criativa.

## Rotina por marco

1. Definir regras concretas e critérios.
2. Implementar a menor entrega funcional.
3. Rodar testes e verificar a experiência móvel.
4. Registrar evidências, limitações e ajustes.
5. Atualizar a documentação e só então ampliar o escopo.
