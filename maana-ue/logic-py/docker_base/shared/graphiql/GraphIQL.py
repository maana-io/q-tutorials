from aiohttp import web
from aiohttp_graphql import render_graphiql
from functools import partial
from graphql.type.schema import GraphQLSchema
from graphql_server import (
    HttpQueryError,
    default_format_error,
    encode_execution_results,
    load_json_body,
    json_encode,
    get_graphql_params
)

#  This file incorporates work covered by the following copyright and  
#  permission notice:  
#   
#      Copyright (c) 2017, Devin Fee (aiohttp-graphql)
#      Copyright (c) 2015, Syrus Akbary (flask-graphql)
#      Copyright (c) 2015, Sergey Privaev (sanic-graphql)
#   
#      Permission to use, copy, modify, and/or distribute this software  
#      for any purpose with or without fee is hereby granted, provided  
#      that the above copyright notice and this permission notice appear  
#      in all copies.  
#   
#      THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL  
#      WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED  
#      WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE  
#      AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR  
#      CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS  
#      OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,  
#      NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN  
#      CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.  


class GraphIQL:
    def __init__(
            self,
            schema=None,
            root_value=None,
            context=None,
            pretty=False,
            graphiql=False,
            graphiql_version='latest',
            graphiql_template=render_graphiql.TEMPLATE,
            jinja_env=None,
            max_age=86400,
            error_formatter=None,
    ):
        # pylint: disable=too-many-arguments
        # pylint: disable=too-many-locals

        self.schema = schema
        self.root_value = root_value
        self.context = context
        self.pretty = pretty
        self.graphiql = graphiql
        self.graphiql_version = graphiql_version
        self.graphiql_template = graphiql_template
        self.jinja_env = jinja_env
        self.max_age = max_age
        self.error_formatter = error_formatter or default_format_error
        assert isinstance(self.schema, GraphQLSchema), \
            'A Schema is required to be provided to GraphQLView.'

    def get_context(self, request):
        if self.context:
            context = self.context.copy()
        else:
            context = {}

        if 'request' not in context:
            context['request'] = request

        return context

    async def parse_body(self, request):
        if request.content_type == 'application/graphql':
            r_text = await request.text()
            return {'query': r_text}

        elif request.content_type == 'application/json':
            text = await request.text()
            return load_json_body(text)

        elif request.content_type in (
                'application/x-www-form-urlencoded',
                'multipart/form-data',
        ):
            # TODO: seems like a multidict would be more appropriate
            # than casting it and de-duping variables. Alas, it's what
            # graphql-python wants.
            return dict(await request.post())

        return {}

    def render_graphiql(self, params, result):

        return render_graphiql.render_graphiql(
            jinja_env=self.jinja_env,
            params=params,
            result=result,
            graphiql_version=self.graphiql_version,
            graphiql_template=self.graphiql_template,
        )

    def is_graphiql(self, request):
        return all([
            self.graphiql,
            request.method.lower() == 'get',
            'raw' not in request.query,
            any([
                'text/html' in request.headers.get('accept', {}),
                '*/*' in request.headers.get('accept', {}),
            ]),
        ])

    def is_pretty(self, request):
        return any([
            self.pretty,
            self.is_graphiql(request),
            request.query.get('pretty'),
        ])

    async def __call__(self, request):
        try:
            data = await self.parse_body(request)
            request_method = request.method.lower()
            is_graphiql = self.is_graphiql(request)

            if request_method == 'options':
                return self.process_preflight(request)

            is_pretty = self.is_pretty(request)

            if request_method == 'options':
                return self.process_preflight(request)

            results, params = await run_query(self.schema, data, request.query)

            result, status_code = encode_execution_results(
                results,
                is_batch=isinstance(data, list),
                format_error=self.error_formatter,
                encode=partial(json_encode, pretty=is_pretty),
            )

            if is_graphiql and params[0].query is not None:
                return await self.render_graphiql(
                    params=params[0],
                    result=result,
                )
            elif is_graphiql and params[0].query is None:
                return await self.render_graphiql(
                    params=params[0],
                    result=None,
                )

            return web.Response(
                text=result,
                status=status_code,
                content_type='application/json',
            )

        except HttpQueryError as err:
            if err.headers and 'Allow' in err.headers:
                # bug in graphql_server.execute_graphql_request
                # https://github.com/graphql-python/graphql-server-core/pull/4
                if isinstance(err.headers['Allow'], list):
                    err.headers['Allow'] = ', '.join(err.headers['Allow'])

            return web.Response(
                text=json_encode({
                    'errors': [self.error_formatter(err)]
                }),
                status=err.status_code,
                headers=err.headers,
                content_type='application/json',
            )

    def process_preflight(self, request):
        """ Preflight request support for apollo-client
        https://www.w3.org/TR/cors/#resource-preflight-requests """
        headers = request.headers
        origin = headers.get('Origin', '')
        method = headers.get('Access-Control-Request-Method', '').upper()

        accepted_methods = ['GET', 'POST', 'PUT', 'DELETE']
        if method and method in accepted_methods:
            return web.Response(
                status=200,
                headers={
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': ', '.join(accepted_methods),
                    'Access-Control-Max-Age': str(self.max_age),
                }
            )
        return web.Response(status=400)


async def run_query(schema, data, query_data):
    data = [data]

    params = [get_graphql_params(a, query_data) for a in data]

    results = []
    for param in params:
        result = await schema.execute(
                param.query,
                operation_name=param.operation_name,
                variable_values=param.variables,
                return_promise=True
            )
        results.append(result)

    return results, params
