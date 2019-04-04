namespace netBox.Types
{
  using System.Collections.Generic;
  using GraphQL.Authorization;
  using GraphQL.Types;
  using netBox.Constants;
  using netBox.Models;
  using netBox.Repositories;

  public class ActionInputObject : InputObjectGraphType<Action>
  {
    public ActionInputObject(IWellRepository wellRepository)
    {
      this.Name = "ActionInput";
      this.Description = "An Action.";
      // To require authorization for all fields in this type.
      // this.AuthorizeWith(AuthorizationPolicyName.Admin);

      this.Field(x => x.id, type: typeof(NonNullGraphType<IdGraphType>))
          .Description("The unique identifier of the Action.");
      this.Field(x => x.name, type: typeof(NonNullGraphType<StringGraphType>));
      this.Field(x => x.type, type: typeof(NonNullGraphType<StringGraphType>));
    }
  }
}
