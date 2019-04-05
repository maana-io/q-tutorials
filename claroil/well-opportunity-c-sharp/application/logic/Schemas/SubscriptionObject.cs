namespace netBox.Schemas
{
    using System.Collections.Generic;
    using System.Reactive.Linq;
    using GraphQL.Resolvers;
    using GraphQL.Types;
    using netBox.Models;
    using netBox.Repositories;
    using netBox.Types;

    /// <summary>
    /// All subscriptions defined in the schema used to be notified of changes in data.
    /// </summary>
    public class SubscriptionObject : ObjectGraphType<object>
    {
        public SubscriptionObject(IWellRepository wellRepository)
        {
            this.Name = "Subscription";
            this.Description = "The subscription type, represents all updates can be pushed to the client in real time over web sockets.";
        }
    }
}
