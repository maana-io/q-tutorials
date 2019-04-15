namespace netBox.Schemas
{
  using System.Collections.Generic;
  using System.Reactive.Linq;
  using GraphQL.Resolvers;
  using GraphQL.Types;
  using netBox.Models;
  using netBox.Repositories;
  using netBox.Types;

  /// <summary>
  /// All subscriptions defined in the schema used to be notified of changes in data.
  /// </summary>
  /// <example>
  /// The is an example subscription to be notified when a human is created.
  /// <c>
  /// subscription whenHumanCreated {
  ///   humanCreated(homePlanets: ["Earth"])
  ///   {
  ///     id
  ///     name
  ///     dateOfBirth
  ///     homePlanet
  ///     appearsIn
  ///   }
  /// }
  /// </c>
  /// </example>
  public class SubscriptionObject : ObjectGraphType<object>
  {
    public SubscriptionObject()
    {
      this.Name = "Subscription";
      this.Description = "The subscription type, represents all updates can be pushed to the client in real time over web sockets.";
    }
  }
}
