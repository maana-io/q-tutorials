const { ApolloClient } = require('apollo-client')
const { createHttpLink } = require('apollo-link-http')
const { setContext } = require('apollo-link-context')
const { InMemoryCache } = require('apollo-cache-inmemory')

const REMOTE_KSVC_ENDPOINT_URL = process.env.REMOTE_KSVC_ENDPOINT_URL

const MACHINE_TO_MACHINE_APP_AUTH_DOMAIN =
  process.env.MACHINE_TO_MACHINE_APP_AUTH_DOMAIN
const MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID =
  process.env.MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID
const MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET =
  process.env.MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET

var request = require('request')

const httpLink = createHttpLink({
  uri: REMOTE_KSVC_ENDPOINT_URL
})

const getToken = async () => {
  var options = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: `{"client_id":"${MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID}","client_secret":"${MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET}","audience":"https://h4.maana.io/","grant_type":"client_credentials"}`
  }

  const response = await fetch(
    `https://${MACHINE_TO_MACHINE_APP_AUTH_DOMAIN}/oauth/token`,
    options
  )
  const json = await response.json()
  const { access_token } = json
  return access_token
}

const authLink = setContext(async (_, { headers }) => {
  // get the authentication token from local storage if it exists
  // return the headers to the context so httpLink can read them
  let token = await getToken()

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

const CKGClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
})

module.exports = { CKGClient }
