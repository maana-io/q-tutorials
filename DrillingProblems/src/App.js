import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import { withApollo } from "react-apollo";
import gql from "graphql-tag";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { place: "Reading, UK", result: "text" };
  }

  handleChange = event => {
    this.setState({ place: event.target.value });
  };

  handleSubmit = event => {
    this.props.client
      .query({
        query: gql`
          query GeoLocationQuery($place: String!) {
            geoLocation(place: $place) {
              city
              country
              mapLink
              coords
              weather {
                summary
                temperature
              }
            }
          }
        `,
        variables: {
          place: this.state.place
        }
      })
      .then(response =>
        this.setState({ result: JSON.stringify(response.data.geoLocation) })
      );

    event.preventDefault();
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Drilling Problems</h1>
        </header>
        <p className="App-intro">Candidate Location</p>
        <form onSubmit={this.handleSubmit}>
          <label>
            Place:
            <input
              type="text"
              value={this.state.place}
              onChange={this.handleChange}
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
