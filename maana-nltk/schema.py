import graphene
import resolvers


class Info(graphene.ObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=True)
    description = graphene.String()


class Sentence(graphene.ObjectType):
    id = graphene.ID(required=True)
    text = graphene.String(required=True)


class Person(graphene.ObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=True)


class Query(graphene.ObjectType):
    info = graphene.Field(Info)
    sentence = graphene.Field(Sentence, id=graphene.ID())
    all_sentences = graphene.Field(graphene.List(Sentence))
    person = graphene.Field(Person, id=graphene.ID())
    all_people = graphene.Field(graphene.List(Person))

    def resolve_info(self, _):
        return resolvers.info()

    async def resolve_sentence(self, info, id):
        return await resolvers.sentence(id)

    async def resolve_all_sentences(self, _):
        return await resolvers.all_sentences()

    async def resolve_person(self, info, id):
        return await resolvers.person(id)

    async def resolve_all_people(self, _):
        return await resolvers.all_people()


class AddSentenceInput(graphene.InputObjectType):
    id = graphene.ID()
    text = graphene.String(required=True)


class AddSentence(graphene.Mutation):

    class Arguments:
        input = AddSentenceInput(required=True)

    Output = Sentence

    async def mutate(self, _, input):
        return await resolvers.add_sentence(input)


class ExtractAndLinkInput(graphene.InputObjectType):
    text = graphene.String(required=True)


class ExtractAndLink(graphene.Mutation):

    class Arguments:
        input = ExtractAndLinkInput(required=True)

    Output = graphene.List(graphene.ID)

    async def mutate(self, _, input):
        return await resolvers.extract_and_link(input)


class Mutation(graphene.ObjectType):
    add_sentence = AddSentence.Field()
    extract_and_link = ExtractAndLink.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
