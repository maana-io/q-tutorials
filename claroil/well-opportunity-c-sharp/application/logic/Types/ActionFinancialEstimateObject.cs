namespace netBox.Types
{
    using System.Collections.Generic;
    using GraphQL.Authorization;
    using GraphQL.Types;
    using netBox.Constants;
    using netBox.Models;
    using netBox.Repositories;

    public class ActionFinancialEstimateObject : ObjectGraphType<ActionFinancialEstimate>
    {
        public ActionFinancialEstimateObject(IWellRepository wellRepository)
        {
            this.Name = "ActionFinancialEstimate";
            this.Description = "Action financial estimate.";
            // To require authorization for all fields in this type.
            // this.AuthorizeWith(AuthorizationPolicyName.Admin); 

            this.Field(x => x.id, type: typeof(NonNullGraphType<IdGraphType>))
                .Description("The unique identifier of the ActionFinancialEstimate.");
            this.Field(x => x.well, type: typeof(NonNullGraphType<WellObject>));
            this.Field(x => x.action, type: typeof(NonNullGraphType<ActionObject>));
            this.Field(x => x.impact, type: typeof(NonNullGraphType<FloatGraphType>));
            this.Field(x => x.cost, type: typeof(NonNullGraphType<FloatGraphType>));
            this.Field(x => x.manHours, type: typeof(NonNullGraphType<FloatGraphType>));
        }
    }
}
