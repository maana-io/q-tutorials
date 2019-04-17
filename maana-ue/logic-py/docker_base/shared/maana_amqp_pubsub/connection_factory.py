from .configuration import AmqpConnectionConfig
from aio_pika import connect
import sys
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


class AMQPConnectionFactory:

    def __init__(self, config: AmqpConnectionConfig):
        self.connection = "amqp://{host}:{port}".format(host=config.host, port=config.port)

    async def create(self):
        try:
            connection = await connect(self.connection)
            return connection
        except Exception as e:
            logger.warning(e)
            pass
