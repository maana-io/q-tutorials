const { GraphQLServer } = require("graphql-yoga");
const { Prisma, forwardTo } = require("prisma-binding");

const PRISMA_ENDPOINT = "http://localhost:8055";
const SERVER_PORT = process.env.PORT || 8056;

const resolvers = {
  Query: {
    location: (_, { vesselId }, context, info) => {
      throw new Error("Not implemented yet");
    },
    eta: (_, { vesselId, portId }, context, info) => {
      throw new Error("Not implemented yet");
    },
    planPortContingency: (_, { vesselId, portId, date }, context, info) => {
      throw new Error("Not implemented yet");
    }
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
      typeDefs: "src/generated/prisma.graphql",
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
