const { GraphQLServer } = require("graphql-yoga");
const { Prisma, forwardTo } = require("prisma-binding");

const PRISMA_ENDPOINT = "http://localhost:8052";
const SERVER_PORT = process.env.PORT || 8053;

const resolvers = {
  Query: {
    atoms: forwardTo("prisma"),
    atom: (_, { id }, context, info) =>
      context.prisma.query.atom(
        {
          where: { id }
        },
        info
      )
  },
  Mutation: {
    createAtom: (_, { name }, context, info) =>
      context.prisma.mutation.createAtom({ data: { name } }, info)
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
      typeDefs: "src/imports/pie.model.graphql",
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
