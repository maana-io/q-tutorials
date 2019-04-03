import React, { Component } from "react"
import Header from "./components/Header"
import Constraints from "./components/Constraints"
import { withApollo } from "react-apollo"
import { GET_OPPORTUNITIES_MOCK, GET_OPPORTUNITIES } from "./graphql/queries"
import Loader from "./components/Loader"

import "../node_modules/bootstrap/dist/css/bootstrap.min.css"
import "./App.css"
import CurrentIncrementalProfit from "./components/CurrentIncrementalProfit"

class App extends Component {
  state = {
    opportunities: null,
    isLoading: false,
    errors: null,
  }

  getApolloErrors = e => {
    let errors = []
    if (e.graphQLErrors.length) {
      errors = e.graphQLErrors
    } else if (
      e.networkError.result &&
      e.networkError.result.errors &&
      e.networkError.result.errors.length
    ) {
      errors = e.networkError.result.errors
    } else {
      errors = [e.message]
    }

    return errors
  }

  handleConstraintsUpdate = constraints => {
    this.setState({ isLoading: true, errorMessage: null }, async () => {
      try {
        const { data } = await this.props.client.query({
          query: GET_OPPORTUNITIES,
          variables: {
            constraint: {
              id: 1,
              budget: constraints.budget,
              manHours: constraints.manHours,
            },
          },
        })
        this.setState({
          opportunities: data.givenConstraintWhatAreOpportunities,
          isLoading: false,
        })
      } catch (e) {
        this.setState({ isLoading: false, errors: this.getApolloErrors(e) })
      }
    })
  }

  render() {
    const { auth } = this.props

    // if we are not logged in, then show the login dialog
    if (window.location.pathname !== "/callback" && !auth.isAuthenticated()) {
      auth.login()
    }

    return (
      <div className="App">
        <Header />
        {window.location.pathname === "/callback" || !auth.isAuthenticated() ? (
          // don't try and load the services if we are still working on authentication
          <div />
        ) : (
          // load and show the services
          <React.Fragment>
            {this.state.opportunities && (
              <CurrentIncrementalProfit opportunities={this.state.opportunities} />
            )}

            {this.state.errors && (
              <div className="alert alert-danger">
                {this.state.errors.map((err, i) => (
                  <p key={i}>{err.message}</p>
                ))}
              </div>
            )}
            <Constraints onContraintsUpdate={this.handleConstraintsUpdate} />
          </React.Fragment>
        )}
        {this.state.isLoading && (
          <div className="loader">
            <Loader />
          </div>
        )}
      </div>
    )
  }
}

export default withApollo(App)
