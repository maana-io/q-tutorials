namespace netBox.Types
{
    using System.Collections.Generic;
    using GraphQL.Authorization;
    using GraphQL.Types;
    using netBox.Constants;
    using netBox.Models;
    using netBox.Repositories;

    public class ConstraintObject : ObjectGraphType<Constraint>
    {
        public ConstraintObject(IWellRepository wellRepository)
        {
            this.Name = "Constraint";
            this.Description = "Constraints.";
            // To require authorization for all fields in this type.
            // this.AuthorizeWith(AuthorizationPolicyName.Admin); 

            this.Field(x => x.id, type: typeof(NonNullGraphType<IdGraphType>))
                .Description("The unique identifier of the Constraint.");
            this.Field(x => x.budget, type: typeof(NonNullGraphType<FloatGraphType>));
            this.Field(x => x.manHours, type: typeof(NonNullGraphType<FloatGraphType>));
        }
    }
}
