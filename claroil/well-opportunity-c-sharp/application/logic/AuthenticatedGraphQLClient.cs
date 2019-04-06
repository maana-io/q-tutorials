using System;
using GraphQL.Client;
using Maana.OAuth;
using System.Net.Http;
using System.Threading.Tasks;
using System.Threading;

namespace Maana.AuthenticatedGraphQLClient
{

    public class LoggingHandler : DelegatingHandler
    {
        public LoggingHandler(HttpMessageHandler innerHandler)
            : base(innerHandler)
        {
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var rand = new Random().Next();

            var time1 = DateTime.Now.ToString("ss-ffff");

            Console.WriteLine("OUTGOING Request: "+rand+"   "+time1+"  "+request.ToString());
            if (request.Content != null)
            {
                Console.WriteLine(await request.Content.ReadAsStringAsync());
            }
            Console.WriteLine();

            HttpResponseMessage response = await base.SendAsync(request, cancellationToken);
            var time2 = DateTime.Now.ToString("ss-ffff");

            Console.WriteLine("INCOMING Reponse: "+rand+"   "+time2+"  "+response.ToString());
            if (response.Content != null)
            {
                Console.WriteLine(await response.Content.ReadAsStringAsync());
            }
            Console.WriteLine();

            return response;
        }
    }

    public class Client
    {
        private Client()
        {

        }
        static GraphQLClient client;

        static object locker = new object();

        public static GraphQLClient GetClientInstance()
        {
            lock(locker){
                if(client == null)
                {
                    Console.WriteLine("{ AuthenticatedGraphQLClient } Creating authenticated graphql client.");

                    string ksvcsURI = Environment.GetEnvironmentVariable("REMOTE_KSVC_ENDPOINT_URL");

                    if(String.IsNullOrWhiteSpace(ksvcsURI))
                        throw new Exception ("REMOTE_KSVC_ENDPOINT_URL environment variable is null/empty.");

                    // Add options with custom loggin middleware
                    var options = new GraphQLClientOptions();
                    var httpClientHandler = new HttpClientHandler();
                    Console.WriteLine(httpClientHandler.MaxConnectionsPerServer);
                    options.HttpMessageHandler = new LoggingHandler(httpClientHandler);

                    client = new GraphQLClient(ksvcsURI, options);

                    // Pass names of environment variables to OAuth fetcher to get credentials.
                    var authFetcher = OAuthFetcher.CreateFetcherUsingEnvironmentVariableNames(
                        "MACHINE_TO_MACHINE_APP_AUTH_DOMAIN",
                        "MACHINE_TO_MACHINE_APP_AUTH_CLIENT_ID",
                        "MACHINE_TO_MACHINE_APP_AUTH_CLIENT_SECRET",
                        "MACHINE_TO_MACHINE_APP_AUTH_IDENTIFIER");

                    var oauth = authFetcher.GetOAuthToken();

                    if(oauth!=null){
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
}
