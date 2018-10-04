from aio_pika import ExchangeType
import sys
import asyncio
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


class AMQPSubscriber:

    def __init__(self, connection_factory):
        self.connection_factory = connection_factory

    async def subscribe(self, queue_config, action):
        connection = await self.connection_factory.create()
        channel = await connection.channel()
        queue = await self.setup_channel(channel, queue_config)
        asyncio.ensure_future(self.subscribe_to_channel(queue, queue_config, action))
        return channel

    async def subscribe_to_channel(self, channel, queue_config, action):
        async def callback(message):
            logger.debug(message.body)
            try:
                await action(message.body)
                message.ack()
                return message.body
            except:
                message.nack()
                return None

        back = await channel.consume(callback)
        return back

    async def setup_channel(self, channel, queue_config):
        try:
            exchange = await channel.declare_exchange(type=ExchangeType.FANOUT, name=queue_config.publish_exchange, durable=True)
            queue = await channel.declare_queue(queue_config.subscribe_queue)
            await queue.bind(exchange, "")
            return queue
        except Exception as e:
            logger.error(e)
            sys.exit(-1)
