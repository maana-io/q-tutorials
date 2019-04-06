using System;
using System.Net.Http.Formatting;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft;
using System.Text;
using RestSharp;
using RestSharp.Authenticators;
using RestSharp.Serializers;
using RestSharp.Serialization;

namespace Maana.OAuth
{
    public class OAuthToken
    {
        public string AccessToken {get; set;}
        public string TokenType  {get; set;}
        public string Scope {get; set;}
        public long ExpiresIn  {get; set;}
    }

    public class OAuthFetcher
    {
        string AUTH_DOMAIN;
        string AUTH_CLIENT_ID;
        string AUTH_CLIENT_SECRET;
        string AUTH_IDENTIFIER;

        public OAuthFetcher(string authDomain, string authClientId, string authClientSecret, string authIdentifier)
        {
            AUTH_DOMAIN = authDomain;
            AUTH_CLIENT_ID = authClientId;
            AUTH_CLIENT_SECRET = authClientSecret;
            AUTH_IDENTIFIER = authIdentifier;
        }

        public string StripCredentials(string str){
            return str
                .Replace(AUTH_IDENTIFIER, "<chunk redacted>")
                .Replace(AUTH_CLIENT_SECRET, "<chunk redacted>");
        }

        /*  
        Factory-style approach for creating an instance of this class.
        Specify the environment variable names in the parameters corresponding to their property, 
        and this method will pull the env variables and return an instance. 
        */ 
        public static OAuthFetcher CreateFetcherUsingEnvironmentVariableNames(string authDomainVariableName, string authClientIdVariableName, string authClientSecretVariableName, string authIdentifierVariableName)
        {
            string authDomain = Environment.GetEnvironmentVariable(authDomainVariableName);
            string authClientId = Environment.GetEnvironmentVariable(authClientIdVariableName);
            string authClientSecret = Environment.GetEnvironmentVariable(authClientSecretVariableName);
            string authIdentifier = Environment.GetEnvironmentVariable(authIdentifierVariableName);

            return new OAuthFetcher(authDomain,authClientId,authClientSecret,authIdentifier);
        }

        public OAuthToken GetOAuthToken()
        {                 
            if(AUTH_IDENTIFIER!=null)
            {
                try{
                    string URL = $"https://{AUTH_DOMAIN}/oauth/token";

                    // The HTTP POST processing in this method uses RestSharp library -- http://restsharp.org/ for documentation.                  
                    var client = new RestClient(new Uri(URL));

                    // Use simple auth scheme.
                    client.Authenticator = new SimpleAuthenticator("client_id",AUTH_CLIENT_ID, "client_secret",AUTH_CLIENT_SECRET);
                    
                    var request = new RestRequest(Method.POST);

                    // POST body.
                    request.AddParameter("grant_type", "client_credentials");
                    request.AddParameter("audience", AUTH_IDENTIFIER);
                            
                    // Headers.
                    request.AddHeader("Accept", "application/json"); 
                    request.AddHeader("Content-Type", "application/x-www-form-urlencoded");

                    // This will execute the request and map the JSON repsonse to the type provided.
                    // Mapping will automatically translate to Pascal case property names from underscore formatted json:
                    // "access_token" -> AccessToken
                    // "token_type" -> TokenType
                    // "scope" -> Scope
                    // "expires_in" -> ExpiredIn
                    var auth = client.Execute<OAuthToken>(request);

                    if(auth==null || auth.Data.AccessToken==null)
                    {
                        Console.WriteLine("OAuth: FAILED TO OBTAIN AUTH TOKEN.");
                        return null;
                    }
                    else
                    {
                        Console.WriteLine($"OAuth: Obtained OAuth token -- type: ${auth.Data.TokenType} expiry: ${auth.Data.ExpiresIn}");
                        return auth.Data;
                    }    
                }
                catch(Exception ex)
                {
                    throw new Exception($"OAuth: Error obtaining OAuth token: {StripCredentials(ex.Message)}");
                }
            } 
            else
            {
                Console.WriteLine("OAuth: No auth identifier detected in environment variables: proceeding WITHOUT authentication!");
                return null; 
            }
        }     

    }

}
