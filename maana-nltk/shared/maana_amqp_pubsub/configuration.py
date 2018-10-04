
class AmqpConnectionConfig:

    def __init__(self, host, port, service=None):
        self.host = host
        self.port = port
        self.service = service


class QueueConfig:

    def __init__(self, queue_name, service_name):
        self.publish_exchange = queue_name + ".Exchange.fanout"
        if service_name is not None:
            self.subscribe_queue = queue_name + "." + service_name + ".Queue"
        else:
            self.subscribe_queue = queue_name + ".Queue"
