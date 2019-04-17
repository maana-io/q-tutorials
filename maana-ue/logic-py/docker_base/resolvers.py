import logging

logger = logging.getLogger(__name__)

resolvers = {
    'Query': {
        'info': lambda value, info, **args: "Maana python template. Used as a basis for creating microservices."
    },
    'Mutation': {
        'info': lambda value, info, **args: "Maana python template. Used as a basis for creating microservices."
    },
}
