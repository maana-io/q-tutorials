import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import { withApollo } from "react-apollo";
import gql from "graphql-tag";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { lat: 1.0, long: 2.0, result: "(no result)" };
  }

  handleChange = (event, key) => {
    this.setState({ [key]: event.target.value });
  };

  handleSubmit = event => {
    console.log("event", event);
    this.props.client
      .query({
        query: gql`
          query LocationExpDrillProb($lat: Float!, $long: Float!) {
            locationExpDrillProb(lat: $lat, long: $long) {
              Problem
              Probability
            }
          }
        `,
        variables: {
          lat: this.state.lat,
          long: this.state.long
        }
      })
      .then(response => {
        this.setState({
          result: JSON.stringify(response.data.locationExpDrillProb)
        });
      });

    event.preventDefault();
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Accenture: Drilling Problems</h1>
        </header>
        <p className="App-intro">Candidate Location</p>
        <form onSubmit={this.handleSubmit}>
          <label>
            Lat:
            <input
              type="text"
              value={this.state.lat}
              onChange={event => this.handleChange(event, "lat")}
            />
          </label>
          <label>
            Long:
            <input
              type="text"
              value={this.state.long}
              onChange={event => this.handleChange(event, "long")}
            />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <textarea value={this.state.result} readOnly />
      </div>
    );
  }
}

export default withApollo(App);
