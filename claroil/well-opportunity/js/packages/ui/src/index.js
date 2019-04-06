import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import Auth from "./Auth";

// apollo imports
import ApolloClient from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloProvider } from "react-apollo";
import { setContext } from "apollo-link-context";

//
// Client setup
// - allow this service to be a client of a remote service
//
const uri = process.env.REACT_APP_MAANA_ENDPOINT;
console.log("uri", uri);

// create the auth object
const auth = new Auth();

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = auth.getAccessToken();
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ""
    }
  };
});

const httpLink = createHttpLink({ uri, fetch });

// Now that subscriptions are managed through RabbitMQ, WebSocket transport is no longer needed
// as it is not production-ready and causes both lost and duplicate events.
const link = authLink.concat(httpLink);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__)
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <App auth={auth} />
  </ApolloProvider>,
  document.getElementById("root")
);

registerServiceWorker();
