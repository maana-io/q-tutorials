import React, { Component } from "react";
import { ApolloConsumer, Query } from "react-apollo";
import gql from "graphql-tag";
//
import "./App.css";

// GraphQL queries and mutations
const GET_ATOM = gql`
  query atom($id: ID!) {
    atom(id: $id) {
      id
    }
  }
`;

class App extends Component {
  render() {
    return (
      <Query query={GET_ATOM} variables={{ id: "a00" }}>
        {({ loading, error, data }) => {
          if (error) {
            return <div>Error :(</div>;
          }
          if (loading) {
            return <div>Loading...</div>;
          }
          console.log("atom", data);

          // transform to conform
          const { atom } = data;
          return <div>{atom.id}</div>;
          // return (
          //   <ApolloConsumer>
          //     {client => <Graph graph={graph} client={client} />}
          //   </ApolloConsumer>
          // );
        }}
      </Query>
    );
  }
}

export default App;
