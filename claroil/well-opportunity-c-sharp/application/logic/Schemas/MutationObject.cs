namespace netBox.Schemas
{
    using GraphQL.Types;
    using netBox.Models;
    using netBox.Repositories;
    using netBox.Types;

    /// <summary>
    /// All mutations defined in the schema used to modify data.
    /// </summary>
    public class MutationObject : ObjectGraphType<object>
    {
        public MutationObject(IWellRepository wellRepository)
        {
            this.Name = "Mutation";
            this.Description = "The mutation type, represents all updates we can make to our data.";
        }
    }
}
