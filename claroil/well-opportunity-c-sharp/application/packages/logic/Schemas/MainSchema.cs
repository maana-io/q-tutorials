namespace netBox.Schemas
{
    using GraphQL;
    using GraphQL.Types;

    public class MainSchema : Schema
    {
        public MainSchema(
            QueryObject query,
            MutationObject mutation,
            SubscriptionObject subscription,
            IDependencyResolver resolver)

            : base(resolver)
        {
            this.Query = resolver.Resolve<QueryObject>();
            this.Mutation = mutation;
            this.Subscription = subscription;
        }
    }
}
