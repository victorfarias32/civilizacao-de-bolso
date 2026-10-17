# Especificação de produto — v0.1

Atualização 0.2.0: os novos conselhos, nove finais e paisagens combinadas estão implementados e especificados em [Destinos e paisagens](DESTINOS.md). Essa especificação substitui as limitações a dois finais descritas no plano original abaixo.

Estado: primeira implementação jogável disponível no código. Ver evidências em [relatório de validação](validacao/RELEASE-v0.1.md); aceite em Android físico permanece pendente.

## Escopo e precedência

[GDD](GDD.md) define intenção criativa; este documento define comportamento; [simulação](specs/SIMULACAO.md) define regras; [validação](specs/VALIDACAO.md) define evidências; [tarefas](tasks/README.md) define execução. Em divergências, corrigir documentos explicitamente antes de codificar. Não alterar silenciosamente o princípio de partidas finitas.

Valores de balanceamento são hipóteses versionadas. Mudanças justificadas por testes não exigem nova arquitetura.

## Público e plataforma

Experiência individual em português do Brasil. Android com Chrome é o primeiro alvo, em modo retrato; desktop também deve funcionar. Layout inicial mínimo de 360 × 640 pixels CSS, sem rolagem horizontal. Abaixo disso, permitir rolagem vertical sem ocultar controles.

Aplicativo estático, sem conta, backend de jogo, anúncios, telemetria ou serviço externo necessário. Recursos visuais e fontes essenciais são locais. Após cache inicial, execução offline no marco M4.

## Jornada

1. Abrir: título, descrição curta, Nova civilização e, quando existir salvamento, Continuar.
2. Nova partida: nome da comunidade (1–40 caracteres), semente inteira opcional e cenário A primeira geração. Valores padrão permitem começar sem preencher nada.
3. Informar que o cenário dura até 40 anos ou a extinção e que o jogador governa por políticas.
4. Iniciar pausado na primavera do ano 1, com 12 habitantes.
5. Explorar mapa, pessoas e política; avançar manualmente ou iniciar o relógio.
6. Receber sinais de risco, mudar políticas e acompanhar a crônica.
7. Após um destino, ver epílogo, fatos principais, exportar e voltar ao início.
8. Nova partida não apaga um salvamento anterior sem uma ação explícita de substituição.

No M1, a abertura pode ser um painel compacto sobre o diorama; não construir telas intermediárias que não ajudam a validar o núcleo.

## Requisitos rastreáveis

| ID | Comportamento | Marco | Tarefas principais |
| --- | --- | --- | --- |
| R01 | Projeto executável, tipado, comandos e CI | M1 | T01–T02 |
| R02 | Estado serializável e evolução determinística | M1 | T03–T04 |
| R03 | Necessidades, coleta, consumo e política de trabalho | M1 | T05–T06 |
| R04 | Crônica factual e sinais de risco | M1 | T07 |
| R05 | Diorama coerente com o estado | M1 | T08 |
| R06 | Interface móvel, inspeção e relógio seguro | M1 | T09–T10 |
| R07 | Madeira, ambiente, construção e manutenção | M2 | T12–T13 |
| R08 | Distribuição, confiança e extração | M2 | T14 |
| R09 | Nascimento, envelhecimento e morte | M2 | T15 |
| R10 | Eventos condicionados, tradições e duas eras | M3 | T17–T18 |
| R11 | Dois destinos finitos e epílogo factual | M3 | T19–T20 |
| R12 | Salvamento e retomada locais | M4 | T22 |
| R13 | Exportação e importação compatível | M4 | T23 |
| R14 | Instalação, offline e atualização segura | M4 | T24–T25 |
| R15 | Acessibilidade, desempenho e arte consistente | M5 | T26–T27 |
| R16 | Publicação estática e operação pelo celular | M5 | T28–T30 |

## Interface durante a partida

- Topo: nome, ano/estação, população, alimento, madeira e vagas de abrigo; ocultar recursos que ainda não existem no marco.
- Mundo: mapa fixo pequeno, ilustração isométrica simplificada; sem câmera complexa ou edição livre de terreno.
- Controles persistentes: pausar/retomar, avançar estação quando pausado, velocidade 1×/2×/4×.
- Painéis inferiores mutuamente exclusivos: Comunidade, Políticas, Crônica, Partida.
- Comunidade: lista acessível, seleção e ficha com identidade, necessidades, aptidão e atividade.
- Políticas: alternativas com descrição; mostrar política vigente e mudança pendente.
- Crônica: eventos por ordem temporal, filtros simples por crise/política/população; não exigir filtros no M1.
- Partida: semente, versão, ajuda, salvar/exportar/importar quando implementados.

Mudar política gera comando para a próxima estação. Controles mostram que está pendente; um comando válido aplicado entra na crônica. Nova escolha da mesma política antes do ciclo substitui a pendente na interface; só a escolha final é enviada ao núcleo.

Toque em pessoa seleciona; se a área for pequena, lista oferece o mesmo acesso. Não depender da leitura de miniaturas nem do Canvas para acessar informações.

## Estados e erros

Boot/carregando → início → partida pausada/em execução → encerrada. Falha de armazenamento mantém a partida em memória e oferece exportação. Arquivo inválido mantém a partida atual. Versão incompatível explica o problema sem tentar executar dados desconhecidos.

Ao ocultar a página, pausar, cancelar acúmulo de tempo e voltar pausado. Sem avanço offline. Tela de fim bloqueia comandos de jogo e mantém leitura/exportação.

## Arte e recursos

O cenário visual usa resolução lógica de 480 × 320 pixels e escala sem suavização. Limite técnico de 60 habitantes vivos. Bosque, água decorativa, clareira e áreas fixas de construção. Sem pathfinding: trajetos visuais interpolam posições de atividades; a produção vem da simulação.

Usar pixel art procedural própria no Canvas, com sprites e camadas cacheados por estado. Cada tipo de acontecimento deve ter um efeito visual verificável; ver DIRECAO-VISUAL.md. Sem compra de assets nem geração de pacotes grandes. Não desenhar construções funcionais antes de existir construção; acampamento decorativo deve ser distinguido.

Paleta quente com vegetação verde, água azul suave e crises sinalizadas por ícone/texto. Redução de movimento interrompe efeitos decorativos. Finais mudam composição, sem prometer efeitos cósmicos na v0.1.

## Ritmo

Uma estação a cada 10 segundos em 1×, 5 segundos em 2× e 2,5 segundos em 4×. Cenário completo em 1× leva aproximadamente 26 minutos e 40 segundos sem pausas. Duração de jogo varia com pausas, velocidade e extinção. Não acelerar apenas a animação fingindo avanço lógico.

No M1, ainda sem os dois destinos narrativos, atingir população zero pausa o protótipo e mostra estado experimental; o encerramento completo vem no M3.

## Fora de escopo

Multiplayer, nuvem de salvamentos, autenticação, IA externa, economia monetária, famílias genealógicas, combate, tecnologia extensa, exploração espacial, todos os destinos avançados e progressão permanente entre partidas.

## Definição de entrega

A v0.1 exige R01–R16, testes relevantes passando, partida finita real, instalação/offline verificados e endereço público confirmado. Uma tela bonita não comprova funcionamento dos sistemas. Ver [matriz de validação](specs/VALIDACAO.md).
