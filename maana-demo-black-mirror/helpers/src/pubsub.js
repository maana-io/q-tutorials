import { AmqpPubSub } from 'maana-amqp-pubsub'
import { log, print } from 'io.maana.shared'

const SELF = (process.env.SERVICE_ID || 'io.maana.template') + '.pubsub'

const RABBITMQ_ADDR = process.env.RABBITMQ_ADDR || '127.0.0.1'
const RABBITMQ_PORT = parseInt(process.env.RABBITMQ_PORT || '5672')

log(SELF).info(
  `Opening RabbitMQ AMQP Connection ${print.info(
    `${RABBITMQ_ADDR}:${RABBITMQ_PORT}`
  )}`
)

const pubsub = new AmqpPubSub({
  config: {
    host: RABBITMQ_ADDR,
    port: RABBITMQ_PORT,
    service: process.env.SERVICE_ID
  }
})

export default pubsub
