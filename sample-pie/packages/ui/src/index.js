import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import ApolloClient from "apollo-boost";
//
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

const LOGIC_ENDPOINT = "http://localhost:8053";

const client = new ApolloClient({
  uri: LOGIC_ENDPOINT
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
registerServiceWorker();
