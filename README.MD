// NOTIFICADOR:
REGRAS DE NEGOCIO/DOMAIN
-Consumir a fila do <rabbit>
-Criar a entidade notification(processo usado durante todo o percursso do codigo) -> até notificar
-Salvar em banco
-Integrar broker<notificador externo>
-Retry no envio, caso ocorra falha no provedor 
-Observabilidade para acompanhar logs importantes
-Tratamento de erro
-Injeção de dependencias 


RabbitMQ Event → UseCase → Notification (em memória) → Envio → 
     → Se sucesso → salva no banco (status: finished)
     → Se falha (tries < 5) → reenqueue
     → Se falha (tries >= 5) → salva no banco (status: failed)

FINALIZADO -> CRIAR TESTES UNITÁRIOS(SEGUINDO PADRÃO FACTORIE, MOCKS E UTILS...)
finalizado a parte de use-case + teste -> implementar o mais tranquilo(INFRA)