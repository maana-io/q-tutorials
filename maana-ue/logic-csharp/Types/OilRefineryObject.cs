namespace netBox.Types
{
  using System.Collections.Generic;
  using GraphQL.Types;
  using netBox.Models;
  using netBox.Repositories;

  public class OilRefineryObject : ObjectGraphType<OilRefinery>
  {
    public OilRefineryObject(IOilRefineryRepository oilRefineryRepository)
    {
      this.Name = "OilRefinery";
      this.Description = "A place where oil is refined.";

      this.Field(x => x.Id, type: typeof(NonNullGraphType<IdGraphType>))
          .Description("The unique identifier of the oil refinery.");
      this.Field(x => x.Location, type: typeof(NonNullGraphType<StringGraphType>))
          .Description("The location of the oil refinery.");
      this.Field(x => x.Capacity, type: typeof(NonNullGraphType<FloatGraphType>))
          .Description("The capacity of the oil refinery.");
    }
  }
}
