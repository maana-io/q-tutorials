This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

## Table of Contents

* [Authentication](#authentication)

## Authentication

Authentication is implemented with [Auth0 Lock Library](https://auth0.com/docs/libraries/lock/v11).  To connect to a Maana endpoint you will have to have authentication setup and working within your application.

Make sure you have the following environment variables set with information from your Auth0 account:
* __REACT_APP_AUTH_CLIENT_ID__: The client ID listed in Auth0 for your Application
* __REACT_APP_AUTH_DOMAIN__: The domain listed in Auth0 for your Application
* __REACT_APP_AUTH_AUDIENCE__: The identifier listed in Auth0 for your API
