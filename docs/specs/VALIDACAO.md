# Plano de validação e critérios de entrega

Estado: verificações planejadas. Nenhum teste do jogo foi executado, pois não existe implementação.

## Evidências e estados

Cada tarefa usa: pendente, em andamento, bloqueada ou concluída. Concluída exige implementação, critérios atendidos e evidências (commit, comando/resultado ou roteiro manual). Não marcar tarefa implementada quando apenas seu documento estiver pronto.

Verificação automática no ambiente e verificação em Android real são evidências distintas. Se o aparelho não estiver disponível ao agente, registrar teste manual como pendente; não inventar dispositivo, captura, desempenho ou aprovação.

## Matriz de testes

| Caso | Procedimento e resultado esperado | Tarefas |
| --- | --- | --- |
| V01 Instalação limpa | npm ci, typecheck, test e build passam com lockfile; README reproduz comandos | T01–T02 |
| V02 Reprodução | Duas execuções de 160 ciclos com mesma configuração/comandos geram JSON canônico idêntico | T03–T04, T21 |
| V03 Independência visual | Comparar avanço manual e relógio, com e sem renderização; estado lógico final idêntico | T10–T11 |
| V04 Conservação | Oferta insuficiente e suficiente: recebido + reserva final = oferta; nenhuma quantidade negativa | T05, T14 |
| V05 Necessidades | Déficit aumenta fome e afeta saúde; descanso recupera energia; saúde zero causa uma morte | T05–T06 |
| V06 Trabalho | Cenário com alimento abundante: intensivo produz mais nos primeiros ciclos e perde mais energia; após 12 ciclos há repouso/custo mensurável | T06, T11 |
| V07 Ambiente | Retirada limitada, recuperação, sazonalidade e degradação seguem fórmulas; interface mostra efeito | T12 |
| V08 Construção | Sem madeira não há obra; material reservado uma vez; vagas surgem no próximo ciclo; conservação importa | T13 |
| V09 Políticas | Mesma seed e decisões diferentes alteram distribuição ou ambiente; mudança pendente entra no ciclo certo | T14 |
| V10 Demografia | Menor não trabalha, recém-nascido não consome retroativamente, limite 60 e velhice respeitados | T15 |
| V11 Eventos | Sem pré-condições não há evento; efeito anunciado só age no próximo ciclo, expira e respeita intervalo | T17 |
| V12 Cultura | Tradição exige sequência real; sem duplicação; era exige 4 ciclos e pode regredir | T18 |
| V13 Encerramento | Zero vivos termina; sobreviventes no ciclo 160 geram legado; zero vivos no ciclo 160 gera só extinção; próximo avanço é inerte | T19 |
| V14 Epílogo | Cada fato possui origem; ausência de evento não produz texto inventado; classificações seguem métricas | T20 |
| V15 Recuperação | Salvar/reabrir preserva estado e os próximos 20 ciclos com as mesmas decisões | T22 |
| V16 Importação | JSON válido preserva; truncado, futuro, excessivo, IDs duplicados e números inválidos são rejeitados sem perda | T23 |
| V17 Offline | Abrir online uma vez, fechar, ativar modo avião e reabrir instalado; jogar, salvar e exportar | T24–T25 |
| V18 Atualização | Versão nova avisa e aguarda ação segura; salvar antes de recarregar; falha preserva versão/partida utilizável | T24–T25 |
| V19 Mobile | 360×640 e aparelho real: sem overflow, painéis acessíveis, toque, retorno após trocar de app sem avanço | T09–T10, T26 |
| V20 Publicação | URL HTTPS abre, arquivos e rotas funcionam sob subdiretório, offline é verificado e versão aparece | T29–T30 |

## Balanceamento

Executar lote inicial de 20 seeds: 1 a 20, até 160 ciclos. Comparar políticas fixas e uma estratégia adaptativa explicitamente documentada. Incluir distribuição, extração e trabalho quando existirem. Separar decisões do cenário da aleatoriedade.

Registrar por execução: sobreviventes, ciclo e motivo do fim, nascimentos/mortes, alimento, saúde média, confiança, floresta/fertilidade e eventos relevantes. Não exigir taxa de vitória inventada.

Critérios mínimos: existir uma trajetória normal reproduzível que chega ao legado; existir uma trajetória de crise reproduzível que termina antes; ambos os destinos também têm fixtures determinísticas de fronteira. Nenhuma política deve ser superior em todas as métricas e todos os cenários medidos. Se ocorrer, registrar e ajustar parâmetros antes do próximo marco.

O lote mede tendências, não comprova equilíbrio universal. Adicionar seeds somente quando uma falha ou dúvida justificar.

## Acessibilidade e desempenho

Metas a medir em build de produção:
- Alvos de toque de pelo menos 44 pixels CSS para controles essenciais.
- Texto principal de pelo menos 16 pixels; contraste WCAG AA no conteúdo textual.
- Todas as informações do Canvas disponíveis também em DOM acessível.
- Suporte a teclado para controles e foco visível; painéis sem prender ou perder foco.
- prefers-reduced-motion e opção de redução; sinais com texto/ícone além de cor.
- Meta de pelo menos 30 quadros por segundo com 60 habitantes no Android de referência.
- Meta de duração p95 de advanceSeason inferior a 50 ms no dispositivo de referência.
- Meta de JavaScript inicial comprimido inferior a 300 KiB, sem assets pesados obrigatórios.

Registrar modelo, versão Android/Chrome, população, ferramenta, build e limitações. Não transformar metas em resultados sem medir. Se exceder, primeiro reduzir desenhos/efeitos e frequência de atualizações da interface, não trocar de motor automaticamente.

## Persistência e compatibilidade

Limitar importação a 5 MiB UTF-8 inicialmente; validar contagens máximas plausíveis para 160 ciclos, referências de IDs, enums, números finitos e invariantes. Dados válidos não precisam ser comprovadamente autênticos: JSON é compartilhamento local, não ranking competitivo.

Versão de regras desconhecida é recusada; versão de esquema desconhecida é recusada. Mostrar mensagem e preservar arquivo/original. Migração só quando implementada e testada.

Autosave transacional mantém um slot atual e uma cópia anterior válida. Simular falha de escrita e quota; exibir estado de erro e permitir exportação da memória.

## Portões

- M1: V01–V06 e interface móvel utilizável; registrar limites experimentais.
- M2: V07–V10 e regressões anteriores relevantes.
- M3: V11–V14, lote de balanceamento e dois destinos alcançáveis.
- M4: V15–V18, V19 de retomada e sem perda em importação inválida.
- M5: V19–V20, acessibilidade, medições, licença e documentação.

Testes manuais que dependam do celular do usuário permanecem explícitos no relatório até executados. A falta de evidência não justifica afirmar versão pronta para publicação.

## Registro por tarefa

Preencher no arquivo da tarefa:
- Commit/PR:
- Comandos executados e resultado:
- Verificação visual/manual:
- Limitações e pendências:

Não preencher esses campos com resultados esperados como se já tivessem ocorrido.
