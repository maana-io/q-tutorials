from CKGClient import CKGClient
from clients import clients

service_clients = []

context_vars = {client: CKGClient(
    clients[client]) for client in service_clients}
