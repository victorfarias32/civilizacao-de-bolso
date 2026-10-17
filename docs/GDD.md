# Game Design Document — Civilização de Bolso

Versão 0.1 — proposta inicial. Os sistemas da primeira versão estão implementados; destinos e eras avançados continuam como visão futura. Números, ritmo e condições exigem validação por protótipos.

A [especificação executável](SPEC.md), as [regras iniciais](specs/SIMULACAO.md) e as [30 tarefas](tasks/README.md) detalham esta visão. Os valores antes pendentes foram propostos como hipóteses de implementação, não como resultados já validados.

## 1. Visão e pilares

O jogador orienta uma pequena sociedade, observa as consequências de suas regras e descobre o destino que ela construiu. A experiência deve despertar carinho pelos habitantes, curiosidade e responsabilidade. Crescimento é um meio; a história da civilização é o resultado.

- Pessoas antes dos números: necessidades e recursos afetam habitantes reconhecíveis.
- Consequências compreensíveis: acontecimentos surpreendem, mas deixam pistas de suas causas.
- Finais que interpretam a trajetória: o encerramento mostra o que aquela sociedade se tornou.
- Escopo incremental: cada novo recurso precisa contribuir para escolhas, consequências ou histórias.

Não é clicker, idle de crescimento infinito nem simulação dependente de IA externa.

## 2. Ciclo principal e tempo

Observar → interpretar → decidir → acompanhar consequências → registrar a história.

A cada estação, o ambiente oferece recursos, os habitantes escolhem atividades, a comunidade produz e consome, necessidades são atualizadas e acontecimentos relevantes entram na crônica. A simulação verifica crises, transições e destinos.

Uma estação é a unidade lógica proposta; quatro estações formam um ano. Animações visuais são independentes desses ciclos. O jogador pode pausar, avançar uma estação e mudar a velocidade; decisões não exigem reflexos. Duração real de partida e velocidade padrão serão definidas em testes.

## 3. Papel do jogador

Guardião das regras coletivas, sem controle direto de cada pessoa. Três políticas iniciais:

| Política | Benefícios possíveis | Custos possíveis |
| --- | --- | --- |
| Distribuição igualitária ou recompensa por contribuição | Segurança coletiva ou incentivo ao trabalho | Menor incentivo ou desigualdade |
| Trabalho moderado ou intensivo | Preservação da saúde ou produção imediata | Reservas menores ou exaustão |
| Extração cuidadosa ou acelerada | Recuperação ambiental ou recursos rápidos | Crescimento lento ou degradação |

Políticas precisam produzir efeitos reais, não apenas texto. Recompensa por contribuição altera o acesso a alimento; pessoas debilitadas podem ficar em desvantagem e aumentar a tensão. Esses efeitos e sua intensidade são hipóteses a balancear.

A interface apresenta intenções e efeitos observados, sem revelar antecipadamente todos os resultados. Nenhuma combinação deve dominar todos os cenários.

## 4. Habitantes

Comunidade inicial de aproximadamente 12 pessoas. Cada pessoa tem identidade, nome, aparência distinguível, idade, fase de vida, saúde, fome, energia, aptidão, um traço simples, atividade e acesso a abrigo.

A escolha de atividade considera condições físicas, urgências da comunidade, políticas e aptidões. Pessoas debilitadas priorizam recuperação; as demais podem coletar e construir. Traços como cooperação, cautela e ambição introduzem diferenças limitadas e explicáveis.

Nascimentos dependem de alimentação, saúde e capacidade de abrigo sustentadas. Mortes podem decorrer de fome, doença, exposição e envelhecimento. Regras demográficas e escalas de idade precisam de definição antes da implementação dessa etapa.

Famílias completas, conversas e redes detalhadas de relações ficam fora da primeira versão. Haverá um limite técnico de população documentado; alimento e abrigo devem conter o crescimento antes dele. A especificação propõe inicialmente 60 pessoas vivas, sujeito a medições no Android.

## 5. Recursos e ambiente

Alimento e madeira são estoques. Abrigo é capacidade construída, com vagas e conservação, não uma terceira moeda.

O ambiente tem alimento sazonal, vegetação com recuperação limitada e fertilidade afetada por exploração excessiva. Madeira é usada em construção e manutenção.

Prosperidade depende de reservas, saúde, abrigo, confiança e recuperação ambiental. Crises surgem de relações entre sistemas:

Extração acelerada → menos vegetação → menor oferta de alimento → trabalho mais intenso → pior saúde → menor capacidade de coleta.

Alertas e mudanças visuais devem tornar os riscos perceptíveis antes de uma perda irreversível. Eventos probabilísticos têm condições e sinais prévios; desnutrição e exposição podem aumentar riscos de doença, enquanto descanso e abrigo reduzem impactos. Evitar catástrofes desconectadas da trajetória.

## 6. Identidade social

Cultura emerge da experiência. Uma fome superada com reservas pode gerar uma tradição de armazenamento. Distribuição desigual durante a mesma crise pode deixar desconfiança.

Na primeira versão, poucas tradições terão origem histórica registrada e efeitos modestos. Facções, instituições complexas, mitologias e arte elaborada ficam para expansões.

## 7. Eras

| Era | Evidências de transição |
| --- | --- |
| Sobrevivência | Respostas imediatas dominam a vida coletiva |
| Comunidade | Abrigo estável, cooperação e primeiras tradições |
| Sociedade | Instituições e especialização persistente |
| Civilização | Conhecimento e infraestrutura sustentam complexidade |
| Transformação | Crise ou descoberta altera caminhos disponíveis |
| Destino | Uma condição de encerramento é alcançada |

Transições dependem de condições sustentadas e acontecimentos, não apenas do relógio. É possível perder capacidades. A primeira versão implementa apenas Sobrevivência e Comunidade.

## 8. Partidas finitas e destinos

Cada destino define condições de possibilidade, sinais prévios, decisões que o consolidam, condição de encerramento e epílogo baseado em fatos.

Primeiro cenário proposto: **A primeira geração**, com 40 anos anunciados desde o início. É um recorte narrativo da fundação e do legado aos sucessores; o prazo não provoca uma catástrofe artificial. O jogador pode encerrar antes pela extinção. O prazo e o ritmo são hipóteses de prototipagem.

Dois desfechos iniciais:
- **Extinção:** nenhum habitante permanece vivo; a crônica identifica causas e momentos decisivos.
- **Legado dos fundadores:** há sobreviventes ao fim do cenário; o epílogo interpreta prosperidade, fragilidade, cooperação, desigualdade e condição ambiental.

Ambos encerram a partida. Após o fim, a história pode ser consultada e exportada, mas a simulação não continua silenciosamente.

Destinos futuros incluem ascensão da alma, evolução cósmica, expansão espacial, simbiose, sociedade perfeita ou sua ilusão, colapso com legado e mistérios da realidade. Não constituem uma lista fechada.

Esses destinos precisam de preparação e coerência ficcional. Ascensão da alma, por exemplo, exige descobertas sobre memória e consciência, capacidade social de sustentá-las e decisões sobre identidade. Não é um upgrade isolado.

Quando destinos competirem, uma prioridade explícita e testada resolverá o encerramento; caminhos secundários relevantes poderão aparecer no epílogo. As prioridades serão definidas quando houver destinos concorrentes implementados.

## 9. Crônica e legado

Registrar acontecimentos estruturados com ciclo, tipo, participantes, condições contribuintes, consequências e vínculos causais quando conhecidos.

Destacar fundação, mudanças políticas, descobertas, crises, recuperação, tradições, personagens e desfecho. Não registrar toda oscilação numérica.

Texto gerado por modelos determinísticos, usando somente fatos registrados. Exemplo de forma, não de evento implementado:

> No oitavo inverno, as reservas chegaram ao fim. A exploração acelerada havia reduzido a recuperação dos bosques, enquanto o trabalho intenso enfraquecia os coletores.

O epílogo reúne os momentos decisivos sem inventar causalidade. Diferenciar causa registrada de simples coincidência. O legado é narrativo, sem bônus permanentes de crescimento entre partidas.

Exportação JSON preservará partida e crônica. Importação servirá inicialmente para recuperar uma partida compatível; cenários que recebem civilizações anteriores ficam para o futuro.

## 10. Arte e experiência móvel

Mundo em pixel art inspirado em jogos de 16 bits, com perspectiva de RPG em vista superior inclinada, texturas, sprites próprios, árvores, rio, ponte, abrigos e habitantes distinguíveis. O mapa inteiro muda com as estações; acontecimentos deixam vestígios além de mensagens. Ver [direção visual](DIRECAO-VISUAL.md).

Primavera com florações e chuva; verão com vegetação densa e frutos; outono com copas douradas e folhas; inverno com neve, gelo, galhos nus e roupas quentes. Extinção deixa ruínas e silêncio; destinos espaciais ou transcendentes podem transformar a composição visual. Evitar hiper-realismo.

O diorama ocupa a maior parte da tela, com recursos e alertas compactos e painéis inferiores para políticas, pessoas e crônica. Toque substitui interações de mouse; nenhuma ação depende de hover. Disponibilizar redução de movimento, texto legível e sinais que não dependam só de cor.

## 11. Escopo da primeira versão

Mapa pequeno; cerca de 12 habitantes iniciais; alimento, madeira e capacidade de abrigo; necessidades básicas; coleta e construção; estações; mudanças populacionais; três políticas; poucos eventos e tradições; duas eras; crônica; extinção e legado; salvamento local; importação e exportação; PWA.

Ficam fora: backend obrigatório, contas, multiplayer, IA externa, árvore tecnológica extensa, viagens espaciais, todos os finais extraordinários e simulação social detalhada.

A primeira versão completa é maior que o primeiro marco: construir e validar um núcleo pequeno antes de ampliá-lo.

## 12. Decisões pendentes de validação

- Ritmo e duração real do cenário de 40 anos.
- Valores de coleta, consumo, recuperação e exaustão.
- Demografia, doença, conservação e construção.
- Limite técnico de população e desempenho em Android.
- Intensidade dos efeitos sociais e critérios das tradições.
- Indicadores e condições sustentadas das duas eras iniciais.

Resolver essas questões no marco correspondente, por testes e observação, sem expandir o escopo antecipadamente.
