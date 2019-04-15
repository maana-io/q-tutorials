namespace netBox.Types
{
  using System.Collections.Generic;
  using GraphQL.Authorization;
  using GraphQL.Types;
  using netBox.Constants;
  using netBox.Models;
  using netBox.Repositories;

  public class InfoObject : ObjectGraphType<Info>
  {
    public InfoObject()
    {
      this.Name = "Info";
      this.Description = "Info about this service.";

      this.Field(x => x.Id, type: typeof(NonNullGraphType<IdGraphType>))
          .Description("The Id of the service.");
      this.Field(x => x.Name)
          .Description("the name of the service.");
      this.Field(x => x.Description)
          .Description("The description of the service.");
    }
  }
}