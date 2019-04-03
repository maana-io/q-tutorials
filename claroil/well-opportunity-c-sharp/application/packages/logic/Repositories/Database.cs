namespace netBox.Repositories
{
  using System;
  using System.Collections.Generic;
  using System.Linq;
  using netBox.Models;
  using GraphQL.Client;

  public static class Database
  {
    static Database()
    {
        GraphQLClient = new GraphQLClient("http://ci05.corp.maana.io:8011/service/e660da3c-e9e3-4450-b67e-9b503888912a/graphql/");
      Droids = new List<Droid>()
            {
                new Droid()
                {
                    Id = new Guid("1ae34c3b-c1a0-4b7b-9375-c5a221d49e68"),
                    Name = "R2-D2",
                    Friends = new List<Guid>()
                    {
                        new Guid("bcf83480-32c3-4d79-ba5d-2bea3bd1a279"),
                        new Guid("c2bbf949-764b-4d4f-bce6-0404211810fa"),
                    },
                    AppearsIn = new List<Episode>() { Episode.NEWHOPE, Episode.EMPIRE, Episode.JEDI, },
                    PrimaryFunction = "Astromech",
                },
                new Droid()
                {
                    Id = new Guid("c2bbf949-764b-4d4f-bce6-0404211810fa"),
                    Name = "C-3PO",
                    Friends = new List<Guid>()
                    {
                        new Guid("1ae34c3b-c1a0-4b7b-9375-c5a221d49e68")
                    },
                    AppearsIn = new List<Episode>() { Episode.NEWHOPE, Episode.EMPIRE, Episode.JEDI, },
                    PrimaryFunction = "Protocol",
                },
                new Droid()
                {
                    Id = new Guid("bcf83480-32c3-4d79-ba5d-2bea3bd1a279"),
                    Name = "2-1B",
                    Friends = new List<Guid>()
                    {
                        new Guid("1ae34c3b-c1a0-4b7b-9375-c5a221d49e68")
                    },
                    AppearsIn = new List<Episode>() { Episode.EMPIRE, },
                    PrimaryFunction = "Surgical",
                },
            };
      Humans = new List<Human>()
            {
                new Human()
                {
                    Id = new Guid("94fbd693-2027-4804-bf40-ed427fe76fda"),
                    DateOfBirth = new DateTime(3020, 4, 5),
                    Name = "Luke Skywalker",
                    Friends = new List<Guid>()
                    {
                        new Guid("7f7bf389-2cfb-45f4-b91e-9d95441c1ecc"),
                    },
                    AppearsIn = new List<Episode>() { Episode.NEWHOPE, Episode.EMPIRE, Episode.JEDI, },
                    HomePlanet = "Tatooine",
                },
                new Human()
                {
                    Id = new Guid("7f7bf389-2cfb-45f4-b91e-9d95441c1ecc"),
                    DateOfBirth = new DateTime(3000, 3, 1),
                    Name = "Darth Vader",
                    Friends = new List<Guid>()
                    {
                        new Guid("94fbd693-2027-4804-bf40-ed427fe76fda")
                    },
                    AppearsIn = new List<Episode>() { Episode.NEWHOPE, Episode.EMPIRE, Episode.JEDI, },
                    HomePlanet = "Tatooine",
                },
            };
    }

    public static List<Droid> Droids { get; }

    public static List<Human> Humans { get; }
    public static GraphQLClient GraphQLClient { get; }

    public static Info Info { get; }
  }
}
