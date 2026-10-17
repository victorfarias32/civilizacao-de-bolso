# Contrato da simulação — regras iniciais

Estado: regras da implementação 0.1.0, com testes automatizados e lote inicial de balanceamento. Referências a M1/M2 registram a divisão planejada; o aplicativo atual executa o conjunto completo. Centralizar parâmetros em conteúdo versionado; alterações exigem registrar motivo e repetir os testes afetados.

## 1. Estado e funções

Estado serializável, sem classes, funções, Map, Set, Date ou referências de interface:

- schemaVersion, rulesVersion, scenarioId, seed, rngState.
- cycle: número de estações concluídas, começando em 0; ano exibido = floor(cycle / 4) + 1; estação seguinte = cycle % 4.
- status: running ou ended; ending ausente até encerramento.
- resources: food e wood em unidades inteiras; zero é o mínimo.
- environment: wildFood, fertility 0–100, forest 0–100.
- inhabitants ordenados por ID estável; vivos e falecidos distinguíveis.
- buildings, policies, history, commandLog, métricas e contadores sustentados.
- IDs monotônicos para pessoas, comandos e eventos.

Funções públicas propostas:
- createGame(config): estado inicial.
- advanceSeason(state, commands): novo estado e eventos; não modifica a entrada.
- deriveSummary(state): indicadores somente de leitura.
- validateSave(value): resultado válido ou lista de erros, sem executar dados.

Estado visual (seleção, painel, animação, velocidade) fica fora das regras. Persistir configurações de acessibilidade separadamente.

## 2. Determinismo e comandos

PRNG xorshift32 com estado uint32 não zero. Seed zero normalizada para 0x6d2b79f5; registrar seed original e estado normalizado. Sorteios de probabilidade usam inteiro 0–9999; chance de 35% significa resultado < 3500. Nunca usar Math.random ou Date.now no núcleo.

Ordenar candidatos por ID; consumir sorteios em ordem fixa apenas para condições elegíveis. Algoritmo, ordem e regras fazem parte de rulesVersion. Reprodução: configuração inicial + versão + sequência dos comandos aceitos.

Comando contém ID, targetCycle e sequência; políticas têm domínio enumerado. Rejeitar ciclo passado, valores inválidos e IDs repetidos; registrar apenas comandos aplicados. Interface envia targetCycle = cycle + 1. Depois do encerramento, avanço devolve estado inalterado e nenhum evento.

## 3. Estado inicial

- 12 habitantes adultos; id h001…h012; idades em anos: 18, 20, 22, 24, 26, 28, 30, 32, 35, 39, 45, 52. Armazenar idade em estações.
- Saúde 100, energia 80, fome 0; nomes de catálogo local escolhidos deterministicamente.
- Distribuir aptidões coleta/construção e traços cooperativo/cauteloso/ambicioso em sequência estável sorteada.
- food 2400; wildFood 3600; fertility 100; forest 100.
- A partir do M2: wood 400 e três abrigos com 4 vagas, integridade 100.
- Políticas padrão: trabalho moderado, distribuição igualitária, extração cuidadosa.
- Confiança coletiva 60 no M2. Mapa 12 × 12 e até 15 posições de abrigo, sem produção dependente de pixel.
- Limite de 60 pessoas vivas impede novos nascimentos, sem eliminar existentes.

M1 ignora sistemas de M2; não aplicar penalidades de falta de abrigo antes de implementar abrigos.

## 4. Ordem de uma estação

1. Se encerrada, não avançar.
2. Aplicar comandos válidos destinados a cycle + 1.
3. Calcular estação e ambiente; aplicar modificadores ativos de eventos já anunciados.
4. Atribuir abrigo, distribuir atividades e reservar materiais de obras.
5. Produzir e aplicar efeitos ambientais da extração.
6. Distribuir alimento e consumir.
7. Atualizar fome, energia, saúde, idade e mortes.
8. Verificar nascimento e métricas sociais.
9. Resolver eventos condicionados e agendar seus efeitos para a próxima estação.
10. Atualizar tradições, era e contadores.
11. Incrementar cycle e verificar destinos.
12. Emitir eventos com IDs e evidências; manter ordem estável.

Decisões usam os valores disponíveis na etapa correspondente; não recalcular atividades após consumir. Diferenças entre registros e estado são erro.

## 5. Atividades e produção

Criança (< 16 anos) não trabalha. Pessoas com saúde < 40 ou energia < 25 descansam obrigatoriamente. A partir de 65 anos, produtividade × 0,6. Demais pessoas ficam disponíveis.

M1: disponíveis coletam alimento. M2: prioridade é alimento se reserva < duas vezes a demanda da população; depois um reparador para o abrigo mais danificado, ou até dois construtores se não há uma vaga de reserva e há madeira; depois até dois coletores de madeira se estoque < 200; restantes coletam alimento.

Aptidão de coleta: × 1,1 para coletor; aptidão de construção: até dois pontos extras de integridade/progresso por trabalhador. Cooperativo: +2 de confiança somente quando surgir evento social associado, sem bônus invisível de produção. Cauteloso descansa quando energia < 35; ambicioso aceita trabalho até energia 20 se saúde >= 40. Registrar essas razões na ficha; segurança de saúde sempre prevalece.

Produção-base por coletor/estação: 440 unidades de alimento ou 30 de madeira.
Multiplicadores: energia inicial / 100, saúde inicial / 100, aptidão, idade e trabalho (1 moderado; 1,35 intensivo). Madeira usa também extração (1 cuidadosa; 1,4 acelerada). Arredondar para baixo uma única vez por pessoa após multiplicadores.

Alimento coletado nunca excede wildFood. Madeira coletada nunca excede forest × 20 no total da estação. Quando oferta limita, atribuir produção proporcionalmente às capacidades; restos inteiros pela maior fração e ID no empate. Registrar contribuição real para distribuição.

Energia: coletar/construir custa 8 moderado ou 18 intensivo; repouso recupera 28. Limitar 0–100. Exaustão: energia final < 25 custa 4 de saúde. Trabalho intensivo não pode apenas multiplicar ganhos sem custo.

## 6. Alimento e necessidades

Demanda por estação: 100 por adulto, 60 por criança. Oferta é reserva após coleta. Cada pessoa recebe no máximo sua demanda; sobra fica estocada.

Igualitária: distribuir proporcionalmente à demanda.
Contribuição (M2): primeira passagem oferece até metade da demanda proporcionalmente; segunda passagem reparte o restante por peso 1 + contribuiçãoReal/100, respeitando demanda restante. Redistribuir excedentes de pessoas já atendidas; fechar restos pela maior fração e ID no empate. Quando alimento é insuficiente, a soma distribuída deve ser exatamente a oferta.

Déficit = 1 − recebido/demanda. Fome aumenta ceil(40 × déficit), ou diminui 20 se recebeu a demanda inteira; limitar 0–100. Saúde perde ceil(16 × déficit); fome final >= 80 custa mais 10. Com alimentação completa, fome final <= 20 e energia final >= 40, recuperar 4 de saúde.

Morrer quando saúde <= 0; interromper atividade e registrar causas numéricas desta estação. Valores de causa podem incluir fome, exaustão, exposição, doença ou velhice, sem atribuir responsabilidade retroativa sem evidência.

## 7. Ambiente e abrigos

M1: regenerar 1600 de wildFood por estação antes da coleta, até 6000; sem floresta, fertilidade ou penalidade de exposição. Esse modelo mínimo mantém o núcleo observável. As regras sazonais e ambientais abaixo substituem essa regeneração constante no M2.

M2: regenerar wildFood antes da coleta, limitado à capacidade = floor(6000 × fertility/100). Regeneração = floor(2000 × fatorEstação × fertility/100), com fatores primavera 1,2; verão 1; outono 0,8; inverno 0,35.

Coleta de madeira reduz forest em ceil(madeiraColetada/20), até zero. Extração cuidadosa recupera forest em 3 por estação, acelerada em 1; aplicar recuperação após retirada. Alimento coletado com extração acelerada tem multiplicador adicional 1,15 e reduz fertility em 2 por estação em que há coleta. Cuidadosa recupera fertility em 1. Se forest < 25, perder mais 1 de fertility; limitar ambos 0–100. Aplicar nova capacidade de alimento na estação seguinte.

Abrigo: custa 120 de madeira reservada na abertura da obra; requer 4 pontos de trabalho; cada construtor entrega 1 ponto, ou 2 com aptidão. Obra concluída oferece 4 vagas na próxima estação. Máximo de 15 abrigos.
Integridade perde 2 por estação; abrigo abaixo de 50 não oferece vagas. Antes de nova construção, reparar o pior abrigo: reservar 20 de madeira e 1 ponto de trabalho para recuperar 20 de integridade, no máximo 100. Sem material, não reservar nem construir.

Distribuir vagas por idade < 16 primeiro, saúde crescente depois e ID no empate. Exposição custa 2 de saúde, ou 8 no inverno. Construções iniciais só existem no M2.

## 8. Demografia e confiança (M2)

Envelhecer uma estação por ciclo; aplicar produtividade conforme idade na abertura do ciclo. A partir de 80 anos, morte por velhice determinística, registrada.

No fim do inverno, considerar no máximo um nascimento: ao menos dois adultos de 18–49 anos, saúde >= 70; alimento para duas demandas atuais; vaga de abrigo livre; confiança >= 45; população abaixo de 60; nenhuma morte por fome nas últimas 4 estações. Exigir também quatro estações consecutivas de produção de alimento >= demanda atual + 60, para evitar nascimentos sustentados apenas por reservas antigas. Se elegível, sorteio de 35%. Criança nasce com idade zero, saúde 100, energia 80 e fome zero; começa a consumir no próximo ciclo. Modelo de cuidadores coletivos, sem gênero ou parentesco simulado.

Confiança 0–100: −5 se houve morte por fome, −2 se diferença entre maior e menor cobertura alimentar > 0,5; +1 quando todos se alimentam e não há exposição, limitado a um ganho por estação, além dos efeitos sociais explicitamente registrados.

No M1, idade pode ser exibida fixa; fome pode levar a zero vivos e pausa experimental. Demografia completa fica em T15.

## 9. Eventos, tradições e eras (M3)

Eventos avaliados em ordem fixa, com intervalo mínimo de 8 estações por tipo. Efeito não retroativo:
- Estiagem: fertility < 60 durante 2 estações; chance 15%; anunciar; próxima estação regeneração de alimento × 0,5.
- Doença: pelo menos 25% dos vivos com fome >= 40 por 2 estações; chance 20%; anunciar sintomas; na próxima estação, pessoas nessas condições perdem 8 de saúde e repouso reduz a perda à metade.
- Mutirão: confiança >= 70 e déficit de abrigo; chance 20%; próxima estação construção recebe +1 ponto por construtor.

Todos os multiplicadores temporários expiram após uma aplicação. Cooldown e candidatos pertencem ao estado salvo. Não adicionar eventos fatais sem condições antecedentes.

Duas tradições, uma aquisição por tipo:
- Guardiões das reservas: houve fome coletiva (pelo menos 25% com fome >= 40), depois 4 estações com reserva >= duas demandas. Prioridade de alimento passa de duas para três demandas na atribuição de tarefas.
- Memória do abrigo: houve exposição de pelo menos 25% da população, depois 4 estações com vagas suficientes. Reparos priorizados abaixo de integridade 70, em vez de 50.

Comunidade: por 4 estações, cobertura total de abrigo, nenhum habitante com fome >= 40 e confiança >= 55. Regressar a Sobrevivência após 4 estações sem pelo menos uma dessas condições. Mudanças registradas uma vez por transição.

## 10. Destinos e crônica

Extinção tem prioridade sobre legado quando ambos ocorrerem no ciclo 160. Extinção: zero vivos. Legado: cycle >= 160 e há vivos. Encerrar apenas uma vez; registrar motivo e congelar evolução.

Resumo final: nome, seed, duração, população inicial/final/pico, nascimentos/mortes, políticas aplicadas, tradições, crises e estado ambiental. Classificação não exclusiva:
- próspera: reserva >= duas demandas e saúde média >= 70;
- fragilizada: reserva < uma demanda ou saúde média < 40;
- cooperativa: confiança >= 70 e distribuição igualitária;
- desigual: distribuição por contribuição e diferença de cobertura > 0,5 em pelo menos 4 das últimas 8 estações;
- degradada: fertility < 40 ou forest < 25.

Ausência de rótulo não cria julgamento inventado. Epílogo combina fatos e trechos locais, sem chamadas externas.

Evento histórico: id, cycle, type, actorIds, dados, evidence e relatedEventIds. Métricas e contadores atualizam todo ciclo; crônica registra transições e marcos. Não inferir causa a partir de mera proximidade temporal. No M1 bastam fundação, política, primeira escassez, recuperação e morte.

## 11. Pendências resolvidas pelo protótipo

Os valores receberam um primeiro ajuste por evidências, registrado em ../validacao/RELEASE-v0.1.md e balance.json. Não equivalem a equilíbrio universal. Manter medições e avaliação em Android real antes de encerrar o aceite final.
