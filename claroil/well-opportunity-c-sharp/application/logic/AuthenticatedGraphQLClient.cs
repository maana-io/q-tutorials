using System;
using GraphQL.Client;
using Maana.OAuth;

namespace Maana.AuthenticatedGraphQLClient
{
    public class Client
    {
        private Client()
        {

        }
        static GraphQLClient client;
        public static GraphQLClient GetClientInstance()
        {
            if(client == null)
            {
                Console.WriteLine("{ AuthenticatedGraphQLClient } Creating authenticated graphql client.");

                client = new GraphQLClient(Environment.GetEnvironmentVariable("REMOTE_KSVC_ENDPOINT_URL")); 

                // Pass names of environment variables to OAuth fetcher to get credentials.
                var authFetcher = OAuthFetcher.CreateFetcherUsingEnvironmentVariableNames(
                    "MACHINE_TO_MACHINE_APP_AUTH_DOMAIN",
                    "MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID",
                    "MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET",
                    "MACHINE_TO_MACHINE_APP_AUTH_IDENTIFIER");

                var oauth = authFetcher.GetOAuthToken();

                if(oauth!=null){
                    Console.WriteLine("{ AuthenticatedGraphQLClient } Obtained OAuth token.");
                    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {oauth.AccessToken??""}");
                }

                return client;
            }
            else
            {
                return client;
            }

        }
    }
}
