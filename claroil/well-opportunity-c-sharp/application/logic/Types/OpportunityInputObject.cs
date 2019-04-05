namespace netBox.Types
{
  using System.Collections.Generic;
  using GraphQL.Authorization;
  using GraphQL.Types;
  using netBox.Constants;
  using netBox.Models;
  using netBox.Repositories;

  public class OpportunityInputObject : InputObjectGraphType<Opportunity>
  {
    public OpportunityInputObject(IWellRepository wellRepository)
    {
      this.Name = "OpportunityInput";
      this.Description = "An Opportunity.";
      // To require authorization for all fields in this type.
      // this.AuthorizeWith(AuthorizationPolicyName.Admin);

      this.Field(x => x.id, type: typeof(NonNullGraphType<IdGraphType>))
          .Description("The unique identifier of the Opportunity.");
      this.Field(x => x.name, type: typeof(NonNullGraphType<StringGraphType>));
      this.Field(x => x.createdAt, type: typeof(NonNullGraphType<DateTimeGraphType>));
      this.Field(x => x.actions, type: typeof(NonNullGraphType<ListGraphType<NonNullGraphType<ActionInputObject>>>));
      this.Field(x => x.incrementalRevenue, type: typeof(NonNullGraphType<FloatGraphType>));
      this.Field(x => x.costReduction, type: typeof(NonNullGraphType<FloatGraphType>));
      this.Field(x => x.cost, type: typeof(NonNullGraphType<FloatGraphType>));
      this.Field(x => x.manHours, type: typeof(NonNullGraphType<FloatGraphType>));
      this.Field(x => x.well, type: typeof(NonNullGraphType<WellInputObject>));
    }
  }
}
