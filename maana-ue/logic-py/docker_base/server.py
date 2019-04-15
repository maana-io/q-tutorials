import os
from aiohttp import web
import aiohttp_cors
import json
import logging
import asyncio
import sys
import graphql as gql
import json
import traceback

from resolvers import resolvers
from scalars import scalars
from graphql.execution.executors.asyncio import AsyncioExecutor

from graphqlclient import GraphQLClient
from graphql_tools import build_executable_schema

from shared.graphiql import GraphIQL
from CKGClient import CKGClient
from settings import SERVICE_ID, SERVICE_ADDRESS, SERVICE_PORT, PROJECT_ROOT, LOG_LEVEL
from context import context_vars

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=LOG_LEVEL)

with open("schema/model.gql", "r") as f:
    model_schema = f.read()

with open("schema/mutation.gql", "r") as f:
    mutations_schema = f.read()

with open("schema/query.gql", "r") as f:
    queries_schema = f.read()

source_schema = model_schema + mutations_schema + queries_schema

executable_schema = build_executable_schema(source_schema, resolvers, scalars)


async def handle_event(x):
    data_in = x.decode('utf8')
    logger.info("Got event: " + data_in)
    # await handle(data_in)
    return None


def init(loopy):
    asyncio.set_event_loop(loopy)
    app = web.Application()
    graphql_executor = AsyncioExecutor(loop=loopy)

    async def graphql(request):
        back = await request.json()
        result = await  gql.graphql(executable_schema, back.get('query', ''), variable_values=back.get('variables', ''),
                                    operation_name=back.get(
            'operationName', ''),
            return_promise=True, allow_subscriptions=True, context_value=context_vars, executor=graphql_executor)
        data = dict()
        if result.errors:
            for err in result.errors:
                try:
                    err.reraise()
                except Exception:
                    tb = traceback.format_exc()
                    logger.error(tb)
                    continue
            data['errors'] = [str(err) for err in result.errors]
        if result.data:
            data['data'] = result.data
        if result.invalid:
            data['invalid'] = result.invalid
        return web.Response(text=json.dumps(data), headers={'Content-Type': 'application/json'})

    async def graphiql(request):
        return web.FileResponse(os.path.join(PROJECT_ROOT, "shared") + "/graphiql/graphiql.html")

    # Configure default CORS settings.
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })

    for route in list(app.router.routes()):
        cors.add(route)

    # For /graphql
    app.router.add_post('/graphql', graphql, name='graphql')
    app.router.add_get('/graphql', graphql, name='graphql')

    app.router.add_route('*', path='/graphiql', handler=graphiql)

    for route in list(app.router.routes()):
        try:
            cors.add(route)
        except:
            continue

    runner = web.AppRunner(app)
    loopy.run_until_complete(runner.setup())
    site = web.TCPSite(runner, SERVICE_ADDRESS, SERVICE_PORT)

    loopy.run_until_complete(
        asyncio.gather(
            asyncio.ensure_future(
                site.start()
            )
        )
    )

    try:
        logging.info("Started server on {}:{}".format(
            SERVICE_ADDRESS, SERVICE_PORT))
        loopy.run_forever()
    except Exception as e:
        runner.shutdown()
        loopy.close()
        logger.error(e)
        sys.exit(-1)
    return None


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    try:
        init(loop)
    except KeyboardInterrupt:
        loop.close()
        sys.exit(1)
