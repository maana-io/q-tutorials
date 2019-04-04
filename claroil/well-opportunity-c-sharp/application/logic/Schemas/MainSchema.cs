namespace netBox.Schemas
{
    using GraphQL;
    using GraphQL.Types;
    using GraphQL.Conversion;
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

            // Fixes default camel casing of field names.
            this.FieldNameConverter = new DefaultFieldNameConverter();
        }
    }
}
