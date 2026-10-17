# Validação — 0.3.0

Marco: três lugares interativos, obra em etapas e descoberta investigável. Implementação concluída, com verificações locais e publicação registradas ao encerrar o marco.

## Verificado

- Build TypeScript/Vite passou. JavaScript principal aproximadamente 147 KiB gzip; sem novas dependências de execução ou backend.
- 51 testes unitários passaram. Incluem custo único, rejeição de ações inválidas, etapas condicionadas por alimento e adultos saudáveis, gasto de energia, diferenças entre locais, descoberta após crescimento, decisões alternativas, viagem com retorno único, celebração, migração e reprodução após recarregar.
- 40 testes de navegador passaram em execução completa, nos perfis desktop e Android emulado. Os testes percorrem por toque o planejamento do bosque, a seleção do local, as quatro etapas, a investigação e a retomada do salvamento. Porto e memorial têm testes de ações, foco, Escape e contraste com Axe.
- Após o acabamento das árvores, os seis casos de lugares foram repetidos e passaram nos dois perfis.
- Fixtures com a mesma estação e semente comparam os pixels das quatro etapas e dos dois resultados da descoberta. Os desenhos são derivados do estado persistido, não apenas avisos na interface.
- A composição reduziu o ruído do solo e os rótulos permanentes sobre as construções. A medição de crescimento encontrou uma mudança discreta demais em conhecimento; a oficina ganhou uma bancada antes da validação final.

## Compatibilidade e limites

Formato 3, regras 0.3.0. Salvamentos 0.1.0 e 0.2.0 migram preservando seus fatos e influências, com as novas ações ainda não realizadas. Partidas encerradas não reabrem. O legado e a extinção continuam sendo destinos válidos; a obra pode ficar inacabada no fim.

A primeira descoberta é uma sequência definida e causal, ligada ao bosque. Não é um catálogo extenso de mistérios, uma economia geral de comércio ou uma árvore completa de pesquisa. A viagem e a celebração são ações únicas. As visitas retratam participantes reais e pausas entre tarefas; não criam habitantes ou produção adicional.

Capturas foram inspecionadas em desktop/Android emulado. Não houve teste físico em telefone. Especificação e custos em [Interações](../INTERACOES.md).
