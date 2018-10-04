import React, { Component } from "react";
import { ApolloConsumer, Query } from "react-apollo";
import gql from "graphql-tag";
//
import "./App.css";
import Graph from "./Graph";

// GraphQL queries and mutations
const GET_GRAPH = gql`
  query graph($id: ID!) {
    graph(id: $id) {
      id
      name
      vertices {
        id
        title
        x
        y
        type
        subtype
      }
      edges {
        id
        title
        type
        source {
          id
        }
        target {
          id
        }
      }
    }
  }
`;

class App extends Component {
  render() {
    return (
      <Query query={GET_GRAPH} variables={{ id: "wuzc3iVSY3ndS6JarBPpCA" }}>
        {({ loading, error, data }) => {
          if (error) {
            return <div>Error :(</div>;
          }
          if (loading) {
            return <div>Loading...</div>;
          }

          // transform to conform
          const graph = {
            ...data.graph,
            nodes: [...data.graph.vertices],
            edges: data.graph.edges.map(e => ({
              ...e,
              source: e.source.id,
              target: e.target.id
            }))
          };
          // console.log("graph", graph);

          return (
            <ApolloConsumer>
              {client => <Graph graph={graph} client={client} />}
            </ApolloConsumer>
          );
        }}
      </Query>
    );
  }
}

export default App;
