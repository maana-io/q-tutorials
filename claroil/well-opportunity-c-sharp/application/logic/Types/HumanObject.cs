namespace netBox.Types
{
    using System.Collections.Generic;
    using GraphQL.Authorization;
    using GraphQL.Types;
    using netBox.Constants;
    using netBox.Models;
    using netBox.Repositories;

    public class HumanObject : ObjectGraphType<Human>
    {
        public HumanObject(IHumanRepository humanRepository)
        {
            this.Name = "Human";
            this.Description = "A humanoid creature from the Star Wars universe.";
            // To require authorization for all fields in this type.
            // this.AuthorizeWith(AuthorizationPolicyName.Admin); 

            this.Field(x => x.Id, type: typeof(NonNullGraphType<IdGraphType>))
                .Description("The unique identifier of the human.");
            this.Field(x => x.Name)
                .Description("The name of the human.");
            this.Field(x => x.DateOfBirth)
                // To require authorization to access the date of birth field.
                //.AuthorizeWith(AuthorizationPolicyName.Admin)
                .Description("The humans date of birth.");
            this.Field(x => x.HomePlanet, nullable: true)
                .Description("The home planet of the human.");
            this.Field(x => x.AppearsIn, type: typeof(ListGraphType<EpisodeEnumeration>))
                .Description("Which movie they appear in.");

            this.FieldAsync<ListGraphType<HumanObject>, List<Human>>(
                nameof(Human.Friends),
                "The friends of the character, or an empty list if they have none.",
                resolve: context => humanRepository.GetFriends(context.Source, context.CancellationToken));
        }
    }
}
