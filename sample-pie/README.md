# Maana Graph

This Knowledge Service provides the concept of a generic graph (i.e., nodes and edges) using three distinct microservices:

- Model Service: Prisma-based GraphQL persistence of the Maana Graph domain model
- Logic Service: graphql-yoga-based service that provides domain-specific logic
- UI Service: React-based application (assistant) that provides a custom interface for managing and manipulating Graphs

## How it was made

This section describes how this services was assembled such that it could be recreated or used as an example of how other services might be built.

### Prerequisites

For convenience, the following commands should be installed globally:

```bash
npm i -g create-react-app prisma graphql-yoga lerna graphql-cli graphql-cli-maana
```

### maana-graph: Lerna monorepo

Create a root directory to contain the project tree:

```bash
mkdir maana-graph
cd maana-graph
```

We can unify the build of the three servies using [Lerna]():

```bash
lerna init
```

Lerna requires that the subprojects reside in a specific location:

```bash
mkdir packages
```

### maana-graph-model: Model service using Prisma

```bash
cd packages
prisma init maana-graph-model
# select 'Create new database'
# select 'MySQL'
cd maana-graph-model
```

#### Update the network ports

Edit the `prisma.yml` and `docker-compose.yml` files to change the network ports, as appropriate.

#### Create the data model

Create a folder to hold all the models for the domain, which will be merged together:

```bash
mkdir models
```

Create and edit `models/graph.gql` to hold the domain model:

```json
enum VertexType {
  Empty
  Special
}

enum VertexSubtype {
  SpecialChild
}

enum EdgeType {
  EmptyEdge
  SpecialEdge
}

# A collection of vertices and edges between them
type Graph {
  # Unique identity of graph instance
  id: ID! @unique
  name: String
  vertices: [Vertex!]! @relation(name: "GraphVertices")
  edges: [Edge!]! @relation(name: "GraphEdges")
}

# Node of a graph
type Vertex {
  # Unique identity of vertex instance
  id: ID! @unique

  # Horizontal position on the diagram
  x: Float!

  # Vertical position on the diagram
  y: Float!

  # Edges where this vertex is the target (i.e., inbound)
  edgesTarget: [Edge!]! @relation(name: "VertexEdgesTarget")

  # Edges where this vertex is the source (i.e., outbound)
  edgesSource: [Edge!]! @relation(name: "VertexEdgesSource")

  # Display label
  title: String

  # Node shape and behavior
  type: VertexType

  subtype: VertexSubtype
}

# Edge connecting two vertices in a graph
type Edge {
  # Unique identity of edge instance
  id: ID! @unique
  source: Vertex! @relation(name: "VertexEdgesSource")
  target: Vertex! @relation(name: "VertexEdgesTarget")
  # visual elements
  title: String
  type: EdgeType
}
```

#### Test Data

Create a `data` folder to hold both _raw_ source data and converted _NDF_ data:

```bash
mkdir -p data/raw
```

Add the following test data to `data/raw/Graph.json`:

```json
[
  {
    "id": "test-g00",
    "name": "Test Graph #00",
    "vertices": ["test-v00", "test-v01", "test-v02", "test-v03"],
    "edges": ["test-e00", "test-e01"]
  }
]
```

and `data/raw/Vertex.json`:

```json
[
  {
    "id": "test-v00",
    "title": "Node A",
    "x": 258.3976135253906,
    "y": 331.9783248901367,
    "type": "Special"
  },
  {
    "id": "test-v01",
    "title": "Node B",
    "x": 593.9393920898438,
    "y": 260.6060791015625,
    "type": "Empty",
    "subtype": "SpecialChild"
  },
  {
    "id": "test-v02",
    "title": "Node C",
    "x": 237.5757598876953,
    "y": 61.81818389892578,
    "type": "Empty"
  },
  {
    "id": "test-v03",
    "title": "Node C",
    "x": 600.5757598876953,
    "y": 600.81818389892578,
    "type": "Empty"
  }
]
```

and, lastly, `data/raw/Edge.json`:

```json
[
  {
    "id": "test-e00",
    "source": "test-v00",
    "target": "test-v01",
    "type": "SpecialEdge"
  },
  {
    "id": "test-e01",
    "source": "test-v02",
    "target": "test-v03",
    "type": "EmptyEdge"
  }
]
```

#### Build

This service requires the docker container be started, the data models be merged corresponding tables created in the database, and seed data converted and imported. We can use NPM to help manage these actions:

```bash
npm init -y
npm i -D babel-cli gql-merge npm-run-all
```

And add the following scripts:

```json
  "scripts": {
    "merge": "gql-merge models/**/*.gql > datamodel.graphql",
    "convert": "gql mload data/raw -n data/ndf -p model",
    "docker-up": "docker-compose up -d",
    "deploy": "prisma deploy --force && gql get-schema -p model",
    "reset": "prisma reset --force && rm -rf data/ndf",
    "import": "prisma import --data data/ndf",
    "prepublish": "npm-run-all merge reset convert docker-up deploy import"
  },
```

### maana-graph-logic: Logic service using graphql-yoga

We now implement a (GraphQL-based) logic layer that uses the domain model (GraphQL persistence layer) per [Prisma's guidance](https://www.prisma.io/docs/tutorials/build-graphql-servers/development/build-a-graphql-server-with-prisma-ohdaiyoo6c). We could just expose the model service directly, but this has a number of [disadvantages](https://www.prisma.io/docs/tutorials/build-graphql-servers/development/build-a-graphql-server-with-prisma-ohdaiyoo6c#why-not-use-the-prisma-api-directly-from-your-client-applications).

```bash
mkdir -p packages/maana-graph-logic/src
cd packages/maana-graph-logic
npm init -y
npm add graphql-yoga prisma-binding
npm add -D npm-run-all
```

#### Setup the GraphQL config

Let's configure two different GraphQL projects (endpoints): our model service and our logic service. These should be configured in `.graphconfig.yml`:

```yaml
projects:
  model:
    schemaPath: src/generated/prisma.graphql
    extensions:
      endpoints:
        default: 'http://localhost:4468'
  app:
    schemaPath: src/schema.graphql
    extensions:
      endpoints:
        default: 'http://localhost:8068'
```

#### Get the generater model schema

Anytime the the model schema changes (and is redeployed), we'll need to update our local copy:

```bash
gql get-schema -p model
```

#### Edit the logic service schema

Instead of surfacing all the raw database operations directly, we provide an abstraction layer that supported the needs of our application.

Edit `src/schema.graphql` so that it has the following "business logic":

```json
# import VertexType, VertexSubtype, EdgeType from "./generated/prisma.graphql"
# import Graph, Vertex, Edge from "./generated/prisma.graphql"

type Query {
  graphs: [Graph!]!
  graph(id: ID!): Graph
  vertex(id: ID!): Vertex
  edge(id: ID!): Edge
}

type Mutation {
  # Create a graph with an optional name
  createGraph(name: String): Graph

  # Create a vertex in a graph
  createVertex(
    graphId: ID!
    name: String
    x: Float
    y: Float
    type: VertexType
    substyle: VertexSubtype
  ): Vertex

  # Create an edge between two vertices in a graph
  createEdge(
    graphId: ID!
    fromVertex: ID!
    toVertex: ID!
    name: String
    style: EdgeType
  ): Edge
}
```

#### Implement the resolvers for the logic

Edit `src/index.js` to create the server and implement the resolvers:

```js
const { GraphQLServer } = require("graphql-yoga");
const { Prisma, forwardTo } = require("prisma-binding");

const PRISMA_ENDPOINT = "http://localhost:4468";
const SERVER_PORT = 8068;

const resolvers = {
  Query: {
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
      { name, x = 0.0, y = 0.0, style, substyle, graphId },
      context,
      info
    ) =>
      context.prisma.mutation.createVertex(
        {
          data: {
            name,
            x,
            y,
            style,
            substyle,
            graph: { connect: { id: graphId } }
          }
        },
        info
      ),
    createEdge: (
      _,
      { graphId, name, fromVertex, toVertex, style },
      context,
      info
    ) =>
      context.prisma.mutation.createEdge(
        {
          data: {
            name,
            style,
            graph: { connect: { id: graphId } },
            fromVertex: { connect: { id: fromVertex } },
            toVertex: { connect: { id: toVertex } }
          }
        },
        info
      )
  }
};

const server = new GraphQLServer({
  typeDefs: "src/schema.graphql",
  resolvers,
  context: req => ({
    ...req,
    prisma: new Prisma({
      typeDefs: "src/generated/prisma.graphql",
      endpoint: PRISMA_ENDPOINT
    })
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
```

#### Sample Graph

```json
mutation createGraph {
  createGraph(name: "Graph #00") {
    id
  }
}

mutation createVertices {
  v00: createVertex(graphId: "cjjq5lfty002r0b73kuq62jp4", name: "A") {
    id
  }

  v01: createVertex(graphId: "cjjq5lfty002r0b73kuq62jp4", name: "B") {
    id
  }
}

mutation createEdges {
  e00: createEdge(
    graphId: "cjjq5lfty002r0b73kuq62jp4"
    name: "f"
    fromVertex: "cjjq5lpgn002v0b73s79pc95c"
    toVertex: "cjjq5lph8002z0b731gclqam0"
  ) {
    id
  }
}

query queryGraph {
  g: graph(id: "cjjq5lfty002r0b73kuq62jp4") {
    name
    edges {
      id
      name
      style
      fromVertex {
        id
        name
        x
        y
        style
        substyle
      }
      toVertex {
        id
        name
        x
        y
        style
        substyle
      }
    }
  }
}
```

### UI service using create-react-app

We provide a custom user interface that allows for the creation and editing of a graph in a domain-specific way.

This is implemented as a small React app built around the [react-digraph](https://github.com/uber/react-digraph) component.

```bash
cd packages
create-react-app maana-graph-assist
cd maana-graph-assist
npm i apollo-boost react-apollo graphql graphql-tag
```

#### Create a GraphQL client to logic service

Edit `src/index.js' to reflect the following changes:

```js
import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import ApolloClient from "apollo-boost";
import gql from "graphql-tag";
//
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

const LOGIC_ENDPOINT = "http://localhost:8068";
```

The main application, `src/App.js`, renders the user interface and communicates via GraphQL to the logic service:

```js
import React, { Component } from "react";
import { ApolloConsumer, Query, Mutation } from "react-apollo";
import ApolloClient from "apollo-boost";
import gql from "graphql-tag";
//
import logo from "./logo.svg";
import "./App.css";
import Graph from "./Graph";
```
