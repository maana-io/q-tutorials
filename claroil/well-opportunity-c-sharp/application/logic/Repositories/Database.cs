namespace netBox.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using netBox.Models;
    using GraphQL.Client;

    public static class Database
    {
        static Database()
        {
            GraphQLClient = new GraphQLClient("http://ci05.corp.maana.io:8011/service/e660da3c-e9e3-4450-b67e-9b503888912a/graphql/");
        }
        public static GraphQLClient GraphQLClient { get; }

        public static Info Info { get; }
    }
}
