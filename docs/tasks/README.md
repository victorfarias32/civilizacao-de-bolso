# Tarefas da v0.1

Estado: implementação da v0.1.0 realizada; 22 tarefas concluídas, 8 em andamento por aceite móvel físico ou publicação. Ver [evidências](../validacao/RELEASE-v0.1.md). Critérios manuais não executados continuam abertos. Este índice é um backlog em arquivos, não um conjunto de issues criado no GitHub.

## Como executar

Ler [plano de ação](../ACAO.md), [spec](../SPEC.md) e arquivo da tarefa. Executar em ordem de dependências e conferir critérios. Atualizar estado no arquivo e neste índice após anexar evidências. Tarefas de fechamento são portões de qualidade; documento pronto não equivale a tarefa concluída.

Estados: pendente → em andamento → concluída; usar bloqueada com motivo e próximo passo quando necessário. Responsável inicial: desenvolvimento assistido por Codex; validação em aparelho real pode exigir execução no Android do titular. Não há delegação obrigatória nem subagentes previstos.

## Fila

| ID | Marco | Tarefa | Depende de | Estado |
| --- | --- | --- | --- | --- |
| [T01](T01.md) | M1 | Estrutura executável | — | concluída |
| [T02](T02.md) | M1 | Verificações contínuas | T01 | concluída |
| [T03](T03.md) | M1 | Estado inicial e aleatoriedade | T01 | concluída |
| [T04](T04.md) | M1 | Ciclos e comandos determinísticos | T03 | concluída |
| [T05](T05.md) | M1 | Coleta, alimento e necessidades | T04 | concluída |
| [T06](T06.md) | M1 | Política de trabalho | T05 | concluída |
| [T07](T07.md) | M1 | Crônica inicial e alertas | T06 | concluída |
| [T08](T08.md) | M1 | Diorama inicial | T03, T05 | concluída |
| [T09](T09.md) | M1 | Interface móvel e inspeção | T07, T08 | em andamento |
| [T10](T10.md) | M1 | Relógio e pausa segura | T04, T09 | concluída |
| [T11](T11.md) | M1 | Fechamento do núcleo | T02, T06, T07, T08, T09, T10 | em andamento |
| [T12](T12.md) | M2 | Ambiente e madeira | T11 | concluída |
| [T13](T13.md) | M2 | Abrigos, construção e conservação | T12 | concluída |
| [T14](T14.md) | M2 | Distribuição, confiança e extração | T12, T13 | concluída |
| [T15](T15.md) | M2 | Gerações e mortalidade | T13, T14 | concluída |
| [T16](T16.md) | M2 | Fechamento da comunidade | T14, T15 | em andamento |
| [T17](T17.md) | M3 | Eventos condicionados | T16 | concluída |
| [T18](T18.md) | M3 | Tradições e eras | T17 | concluída |
| [T19](T19.md) | M3 | Cenário finito e destinos | T18 | concluída |
| [T20](T20.md) | M3 | Epílogo e memória final | T07, T19 | concluída |
| [T21](T21.md) | M3 | Balanceamento e fechamento narrativo | T19, T20 | concluída |
| [T22](T22.md) | M4 | Salvamento local | T21 | concluída |
| [T23](T23.md) | M4 | JSON exportável e importação segura | T22 | concluída |
| [T24](T24.md) | M4 | PWA, cache e atualizações | T22, T23 | concluída |
| [T25](T25.md) | M4 | Fechamento da continuidade | T24 | em andamento |
| [T26](T26.md) | M5 | Acessibilidade e acabamento móvel | T25 | em andamento |
| [T27](T27.md) | M5 | Arte coerente e desempenho | T26 | em andamento |
| [T28](T28.md) | M5 | Documentação e licenças | T26 | concluída |
| [T29](T29.md) | M5 | Preparação e publicação estática | T27, T28 | em andamento |
| [T30](T30.md) | M5 | Aceite da v0.1 e registro da entrega | T29 | em andamento |

## Rotina de conclusão

1. Limitar alterações ao objetivo da tarefa e aos ajustes necessários.
2. Rodar verificações relevantes; não criar testes que apenas repetem a implementação.
3. Registrar commit/PR, comandos, resultados e validação manual realmente realizados.
4. Atualizar critérios de aceite e estado. Bloqueios ficam explícitos.
5. Atualizar documentação afetada e seguir para a próxima tarefa elegível.

## Prompt reutilizável

> Implemente Txx deste repositório. Leia docs/tasks/Txx.md e suas referências, confira as dependências e o código atual, implemente os critérios de aceite, execute as verificações relevantes e registre evidências. Não declare funcionalidades ou testes que não verificou. Prossiga nas tarefas autorizadas até concluir o marco ou encontrar um bloqueio real, mantendo o escopo da v0.1.

## Backlog após v0.1

Instituições, facções, pesquisa, tecnologias, novas eras, expansão espacial, ascensão da alma, simbiose profunda, destinos secretos e cenários com civilizações importadas. Não fazem parte das 30 tarefas atuais.

## Expansão 0.2.0

[T31 — Conselhos, destinos e paisagens combinadas](T31.md): nove finais e caminhos extraordinários implementados como decisões e condições. Substitui a exclusão desses destinos no backlog original; pesquisa extensa, facções e novas eras permanecem futuras.

[T32 — Escolhas coloridas e bairros em transformação](T32.md): ganhos reais caracterizados por cor, espaços públicos e arquitetura que crescem continuamente com as influências.
