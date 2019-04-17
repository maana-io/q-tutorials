import sys
from .subscriber import AMQPSubscriber
from .connection_factory import AMQPConnectionFactory
from .configuration import QueueConfig
import asyncio
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


class AmqpPubSub:

    def __init__(self, config, trigger_transform=lambda x: str(x)):

        self.trigger_transform = trigger_transform

        self.config = config

        factory = AMQPConnectionFactory(config)

        self.consumer = AMQPSubscriber(factory)

        self.subscription_map = {}
        self.subs_ref_map = {}
        self.current_sub_id = 0
        self.unsubscribe_channel = 0

    async def subscribe(self, trigger, on_message):

        trigger_name = self.trigger_transform(trigger)
        self.current_sub_id = self.current_sub_id + 1
        self.subscription_map[self.current_sub_id] = [trigger_name, on_message]
        refs = self.subs_ref_map.get(trigger_name)
        if refs is not None and len(refs) > 0:
            self.subs_ref_map[trigger_name] = refs.append(self.current_sub_id)
        else:
            disposer = asyncio.ensure_future(self.consumer.subscribe(
                QueueConfig(trigger_name, self.config.service),
                lambda msg: self.on_message(trigger_name, msg)
            ))
            if trigger_name in self.subs_ref_map.keys():
                self.subs_ref_map[trigger_name] = self.subs_ref_map[trigger_name].append(self.current_sub_id)
            else:
                self.subs_ref_map[trigger_name] = [self.current_sub_id]

            self.unsubscribe_channel = disposer
            return self.current_sub_id

    async def on_message(self, channel, message):
        subscribers = self.subs_ref_map.get(channel)

        if subscribers is None:
            return None

        for index, elem in enumerate(subscribers):
            executor = self.subscription_map[index+1]
            try:
                await executor[1](message)
            except Exception as e:
                logger.error("Problem running handler on event: " + str(e))
                pass
