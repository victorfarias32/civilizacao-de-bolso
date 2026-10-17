# Arquitetura técnica proposta

Estado: arquitetura implementada na primeira versão jogável. Ver [validação](validacao/RELEASE-v0.1.md).

Detalhes executáveis: [spec](SPEC.md), [contrato da simulação](specs/SIMULACAO.md) e [tarefas](tasks/README.md). Os parâmetros antes pendentes têm valores iniciais propostos, ainda sem validação de balanceamento.

## Tecnologias

- TypeScript: modelos, regras, conteúdo e interface.
- React: painéis, controles e navegação.
- Vite: servidor de desenvolvimento e construção estática.
- Canvas 2D: diorama e animações. Não adicionar motor inicialmente.
- IndexedDB: partidas e crônicas locais.
- PWA com service worker: instalação e acesso offline após carregar os recursos necessários.
- Vitest: testes das regras fundamentais.

Não há backend obrigatório, autenticação do jogador, API paga ou IA externa. PixiJS só será reavaliado se medições demonstrarem necessidade de desempenho ou efeitos. Não adicionar infraestrutura especulativa.

## Organização prevista

```text
src/
  simulation/
    model/
    systems/
    policies/
    events/
    endings/
  content/
  rendering/
  ui/
  persistence/
```

Simulação não importa React, Canvas, navegador ou armazenamento. Recebe estado e comandos; produz próximo estado e acontecimentos. Preferir dados serializáveis e funções explícitas a frameworks internos ou sistemas genéricos de plugins.

Conteúdo guarda nomes, políticas, textos e definições. Renderização lê o estado e produz apenas apresentação. Interface converte ações em comandos; não modifica o estado por caminhos ocultos. Persistência valida, salva e recupera dados sem definir regras de jogo.

## Atualização e reprodução

Atualizações lógicas em passos fixos de uma estação. Ordem inicial proposta: aplicar comandos, calcular condições ambientais, distribuir atividades, produzir, distribuir e consumir, atualizar necessidades e demografia, avaliar eventos e tradições, verificar eras e destinos, emitir registros históricos.

Essa ordem deve ser refinada e testada quando cada sistema entrar; fome e mortalidade não podem ser resolvidas de modo inconsistente entre caminhos de execução.

- Gerador pseudoaleatório centralizado com semente e estado persistidos.
- Ordem estável de processamento de habitantes e sistemas.
- Comandos registrados com ciclo e ordem de aplicação.
- Sem relógio real, animações ou chamadas aleatórias independentes nas regras.
- Versão das regras registrada junto da partida.

Reprodução exige estado inicial, semente, versão compatível das regras e mesma sequência de comandos. A semente sozinha não garante a mesma história.

Animações podem interpolar visualmente estados, mas não determinam coleta, deslocamentos lógicos ou resultados. Na primeira versão, movimentação visual não pressupõe navegação complexa. Nenhum habitante deve aparentar produzir recursos por um sistema ainda inexistente.

Ao ocultar o aplicativo, pausar a execução; não simular progresso offline inicialmente. Ao retomar, evitar saltos acumulados no relógio visual.

## Persistência e intercâmbio

Formato JSON versionado contendo versão do esquema, versão das regras, semente e estado do gerador, ciclo, mundo, habitantes, políticas, comandos e crônica.

Salvar localmente em limites lógicos, tratar indisponibilidade e falhas de armazenamento e oferecer exportação como cópia de segurança. Armazenamento do navegador pode ser apagado pelo usuário ou pelo sistema; a interface deve permitir recuperar uma exportação.

Validar estrutura, valores, versão e tamanho razoável antes de aceitar importações. Uma importação inválida não pode sobrescrever a partida atual. Exibir textos importados como texto, sem executar HTML ou código. Definir migrações quando existir uma mudança real de esquema; não prometer compatibilidade entre versões ainda não projetadas.

## PWA e publicação

Hospedagem estática em HTTPS. Sem servidor próprio para executar partidas. Service worker e estratégia de atualização serão introduzidos no marco de persistência e instalação, evitando substituir recursos de uma partida ativa de forma inconsistente.

Verificar funcionamento offline, recuperação de partidas, atualização do aplicativo e ausência de dependências remotas necessárias para jogar. Não anunciar PWA funcional somente pela existência de um manifesto.

## Desenvolvimento somente pelo celular

Fluxo: repositório GitHub → ambiente de desenvolvimento na nuvem acessado pelo navegador Android → prévia navegável → testes → publicação estática.

Não pressupor terminal instalado no telefone ou computador pessoal. Ambiente de desenvolvimento na nuvem pode ter custo e limites próprios; isso é independente de o jogo funcionar localmente. GitHub Pages tem workflow preparado, mas sua ativação foi recusada pela integração (HTTP 403). Sites é a alternativa de hospedagem da versão de teste.

## Validação

Testar consumo e distribuição, limites de recursos, fome e recuperação, determinismo, mortalidade, encerramento e leitura/escrita de partidas quando implementados. Verificar também toque, legibilidade, redimensionamento, pausa ao sair e desempenho em Android real.

Testes de regras não substituem validação visual e de uso. Medir antes de introduzir workers, motores ou otimizações complexas.

## Documentação e licença

Manter README com estado real do projeto, comandos executáveis quando existirem e instruções de teste/publicação. Atualizar GDD e plano conforme decisões forem validadas.

O código e a arte original adotam MIT, conforme LICENSE. Registrar autoria e licença de cada recurso visual, fonte ou áudio antes de incluí-lo.
