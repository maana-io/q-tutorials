const { GraphQLServer } = require("graphql-yoga");
const { Prisma, forwardTo } = require("prisma-binding");

const PRISMA_ENDPOINT = "http://localhost:8052";
const SERVER_PORT = process.env.PORT || 8053;

const resolvers = {
  Query: {
    graphs: forwardTo("prisma"),
    graph: (_, { id }, context, info) =>
      context.prisma.query.graph(
        {
          where: { id }
        },
        info
      ),
    vertex: (_, { id }, context, info) =>
      context.prisma.query.vertex(
        {
          where: { id }
        },
        info
      ),
    edge: (_, { id }, context, info) =>
      context.prisma.query.edge(
        {
          where: { id }
        },
        info
      )
  },
  Mutation: {
    createGraph: (_, { name }, context, info) =>
      context.prisma.mutation.createGraph({ data: { name } }, info),
    createVertex: (
      _,
      { title, x = 0.0, y = 0.0, type, subtype, graphId },
      context,
      info
    ) =>
      context.prisma.mutation.createVertex(
        {
          data: {
            title,
            x,
            y,
            type,
            subtype,
            graph: { connect: { id: graphId } }
          }
        },
        info
      ),
    createEdge: (
      _,
      { graphId, title, sourceVertexId, targetVertexId, type },
      context,
      info
    ) =>
      context.prisma.mutation.createEdge(
        {
          data: {
            title,
            type,
            graph: { connect: { id: graphId } },
            source: { connect: { id: sourceVertexId } },
            target: { connect: { id: targetVertexId } }
          }
        },
        info
      )
  }
};

const server = new GraphQLServer({
  typeDefs: "src/schema.graphql",
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  },
  context: req => ({
    ...req,
    prisma: new Prisma({
      typeDefs: "src/imports/io.maana.graph.model.graphql",
      endpoint: PRISMA_ENDPOINT
    }),
    debug: true
  })
});

const options = {
  port: SERVER_PORT
};

server.start(options, () =>
  console.log(
    `GraphQL server is running on http://localhost:${options.port || 4000}`
  )
);
