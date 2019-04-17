namespace netBox.Schemas
{
  using GraphQL;
  using GraphQL.Types;

  public class MainSchema : Schema
  {
    public MainSchema(
        QueryObject query,
        IDependencyResolver resolver)

        : base(resolver)
    {
      this.Query = resolver.Resolve<QueryObject>();
    }
  }
}
