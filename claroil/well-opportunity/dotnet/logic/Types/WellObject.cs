namespace netBox.Types
{
    using System.Collections.Generic;
    using GraphQL.Authorization;
    using GraphQL.Types;
    using netBox.Constants;
    using netBox.Models;
    using netBox.Repositories;

    public class WellObject : ObjectGraphType<Well>
    {
        public WellObject(IWellRepository wellRepository)
        {
            this.Name = "Well";
            this.Description = "A well.";
            // To require authorization for all fields in this type.
            // this.AuthorizeWith(AuthorizationPolicyName.Admin); 

            this.Field(x => x.id, type: typeof(NonNullGraphType<IdGraphType>))
                .Description("The unique identifier of the Well.");
            this.Field(x => x.name, type: typeof(NonNullGraphType<StringGraphType>))
                .Description("The name of the Well.");
        }
    }
}
