# Notification Service By Order

## Propósito

Serviço para processar eventos de notificação vindos de outros serviços (ex.: fila `orders`), enviar notificações por canais configurados e garantir retry/persistência quando necessário.

---

## Visão Geral do Domínio

### Entidades Principais

- **`Notification`**: representa uma notificação com campos como `id`, `channel`, `status`, `tries`, `recipient` e regras de negócio (incremento de `tries`, verificação de máximo de tentativas).
- **`Recipient`**: dados do destinatário (`clientId`, `phoneNumber`, `name`). Validações de formato e obrigatoriedade são feitas ao criar a entidade.

### Regras de Negócio Essenciais

- Ao receber um evento, o worker constrói as entidades do domínio (`Recipient` e `DomainNotification`).
- O processamento é orquestrado pelo use-case `NotificationDispatcher`:
  - Tenta enviar via `NotificationSender`.
  - Se o envio falhar, chama `NotificationRetryScheduler` (incrementa `tries` e decide entre re-enfileirar via `publishToRetry` ou persistir em banco quando excede tentativas).
  - Se o envio for bem-sucedido, chama `NotificationCreationPublisher` para publicar eventos de criação (`publishToCreate`) que alimentam o fluxo de persistência/consumo ulterior.

---

## Implementação Atual (Infra)

### Workers

- **`NotificationSenderWorker`** — consome a fila de entrada (por padrão `notification-queue`, configurável pela variável de ambiente `INCOMING_QUEUE`). Processa mensagens de envio e aciona o `NotificationDispatcher`.
- **`NotificationPersistenceWorker`** — consome `notification-create-queue` e persiste/valida payloads; atualmente confirma/nack conforme validação.

### Gateway RabbitMQ

- Implementado em `src/infra/rabbitmq/rabbitmq-notification-gateway.ts` (classe `Rabbit`) que expõe `publishToRetry` e `publishToCreate`.
- Garante filas com TTL e argumentos (dead-letter routing key para retry) e usa `sendToQueue` para publicar mensagens.

### Container / DI / Logging

- `tsyringe` é usado para injeção de dependências (`src/shared/container/container.ts`).
- `WinstonLogger` implementa logging centralizado.

---

## Fluxo de Evento (Simplificado)

1. Outro serviço publica um evento na fila (ex.: `orders`). O `NotificationSenderWorker` deve escutar a fila correta — por isso a variável `INCOMING_QUEUE` foi adicionada.
2. O worker parseia o payload, cria entidades do domínio e chama `await dispatcher.execute(notification)`.
3. `NotificationDispatcher` orquestra `send` → `retry`/`publish` conforme resultado.
4. `NotificationRetryScheduler` usa `NotificationGateway.publishToRetry` para re-enfileirar com TTL; `NotificationCreationPublisher` usa `publishToCreate` para enfileirar eventos de criação.

---

## Problemas / Decisões Atuais

### Política de ack/nack

- `NotificationSenderWorker` atualmente faz `nack(..., true)` em algumas falhas de validação; isso pode levar a reprocessamento infinito de mensagens com payload inválido. Recomenda-se `requeue=false` para payloads permanentemente inválidos, e `requeue=true` apenas para falhas transitórias.
- `NotificationPersistenceWorker` usa `requeue=false` em validações, o que é mais seguro para mensagens inválidas.

### Tratamento de Falhas ao Publicar

Os gateways retornam um `Result` em vez de lançar. Quando a publicação falha, o use-case persiste a notificação no repositório como fallback em vez de requeue automático.

---

## O Que Vamos Implementar A Seguir

### Persistência com Postgres + Prisma

- Adicionar `Prisma` como ORM e esquema para `Notification` e `Recipient`.
- Conectar a um banco Postgres configurável via `DATABASE_URL`.
- Implementar repositório `NotificationRepository` usando Prisma para `save`, `find`, e consultas necessárias ao fluxo de retry/persistência.

### Infra de Execução / Desenvolvimento

- `docker-compose` para levantar RabbitMQ e Postgres localmente durante desenvolvimento e testes.
- Migrations Prisma e seed básico para dados de teste.

### Melhorias de Confiabilidade

- Adicionar dead-letter queues (DLQ) para mensagens com payload inválido.
- Ajustar política de ack/nack conforme tipo de erro (transiente vs permanente).
- Melhorar observability (metrics, traces) e alertas quando muitas mensagens falharem.

### Testes e CI

- Cobertura de use-cases e workers com testes unitários/integração (Vitest já presente no projeto).
- Pipeline de CI que executa linter, testes e (opcionalmente) migrations em um ambiente temporário.

---

## Variáveis De Ambiente Importantes (Sugestão)

- `RABBITMQ_URL` — URL de conexão com RabbitMQ (ex.: `amqp://guest:guest@localhost:5672`).
- `INCOMING_QUEUE` — nome da fila que o `NotificationSenderWorker` consome (ex.: `orders`).
- `DATABASE_URL` — URL de conexão com Postgres (a ser usado pelo Prisma).

---

## Arquivos / Locais Chave

- `src/infra/rabbitmq/workers/notification-sender-worker.ts` — worker principal de entrada.
- `src/infra/rabbitmq/workers/notification-persistence-worker.ts` — worker de persistência/consumo de criação.
- `src/infra/rabbitmq/rabbitmq-notification-gateway.ts` — implementa `NotificationGateway`.
- `src/domain/application/use-cases/*` — use-cases de orquestração (`NotificationDispatcher`, `NotificationRetryScheduler`, `NotificationCreationPublisher`).
- `src/shared/container/container.ts` — registro de dependências (injeção).

---

## Próximos Passos Sugeridos

- [ ] Implementar repositório com Prisma e adicionar migrations.
- [ ] Criar `docker-compose.yml` com RabbitMQ + Postgres para desenvolvimento local.
- [ ] Ajustar ack/nack e adicionar DLQ para mensagens inválidas.
- [ ] Escrever testes de integração cobrindo o fluxo completo (worker → dispatcher → gateway/repo).
