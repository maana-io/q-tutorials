namespace netBox.Types
{
  using System.Collections.Generic;
  using GraphQL.Authorization;
  using GraphQL.Types;
  using netBox.Constants;
  using netBox.Models;
  using netBox.Repositories;

  public class MetricsInputObject : InputObjectGraphType<Metrics>
  {
    public MetricsInputObject(IWellRepository wellRepository)
    {
      this.Name = "MetricsInput";
      this.Description = "Metrics.";
      // To require authorization for all fields in this type.
      // this.AuthorizeWith(AuthorizationPolicyName.Admin);

      this.Field(x => x.id, type: typeof(NonNullGraphType<IdGraphType>))
          .Description("The unique identifier of the Metrics.");
      this.Field(x => x.waterCut, type: typeof(NonNullGraphType<FloatGraphType>));
      this.Field(x => x.GOR, type: typeof(NonNullGraphType<FloatGraphType>));
      this.Field(x => x.oilRate, type: typeof(NonNullGraphType<FloatGraphType>));
      this.Field(x => x.date, type: typeof(NonNullGraphType<IntGraphType>));
      this.Field(x => x.well, type: typeof(NonNullGraphType<WellInputObject>));
      this.Field(x => x.type, type: typeof(NonNullGraphType<StringGraphType>));
    }
  }
}
