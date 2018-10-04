import uuid
import json
import sys
import nltk
from nltk import word_tokenize, pos_tag, ne_chunk, sent_tokenize
import schema
import logging
from shared.kinddbsvc.KindDBSvc import KindDBSvc
from settings import KINDDB_SERVICE_URL

kindDB = KindDBSvc(tenantId=0, svcUrl=KINDDB_SERVICE_URL)

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def _extract_people(text):
    extracted = ne_chunk(pos_tag(word_tokenize(text)))
    peeps = []
    for child in extracted:
        if isinstance(child, nltk.tree.Tree):
            if child.label() == "PERSON":
                peeps.append(child.leaves()[0][0])

    return peeps

# Resolvers


def info():
    return schema.Info(
        id="ab739864-c0ff-40aa-bcdf-972c0bc794dd",
        name="Maana NLTK service",
        description="This is a service for using NLTK with MaanaQ"
    )


async def all_sentences():
    sentences_res = await kindDB.getAllInstancesByName(kindName="Sentence")
    base = sentences_res.get("allInstances")
    sentences = []
    if base is not None:
        records = base.get("records")
        for r in records:
            sentences.append(schema.Sentence(id=r[0].get("ID"), text=r[1].get("STRING")))
    return sentences


async def sentence(id):
    sentences_res = await kindDB.getInstanceByName(kindName="Sentence", instanceId=id)
    base = sentences_res.get("instance")
    r = base.get("fieldValues")
    return schema.Sentence(id=r[0].get("ID"), text=r[1].get("STRING"))


async def add_sentence(sentence):
    new_sentence = schema.Sentence(id=sentence.get("id", str(uuid.uuid4())), text=sentence.get("text"))
    await kindDB.addInstanceByKindName(
        "Sentence",
        {
            "id": new_sentence.id,
            "text": new_sentence.text
        }
    )

    return new_sentence


async def all_people():
    people_res = await kindDB.getAllInstancesByName(kindName="Person")
    base = people_res.get("allInstances")
    people = []
    if base is not None:
        records = base.get("records")
        for r in records:
            people.append(schema.Person(id=r[0].get("ID"), name=r[1].get("STRING")))
    return people


async def person(id):
    person_res = await kindDB.getInstanceByName(kindName="Person", instanceId=id)
    base = person_res.get("instance")
    r = base.get("fieldValues")
    return schema.Person(id=r[0].get("ID"), name=r[1].get("STRING"))


async def extract_and_link(input):

    text = input.text
    raw_sentences = sent_tokenize(text)
    sentences = map(lambda sents: schema.Sentence(id=str(uuid.uuid4()), text=sents), raw_sentences)

    for s in sentences:
        extracted_people = _extract_people(s.text)
        await kindDB.addInstanceByKindName(
            "Sentence",
            {
                "id": s.id,
                "text": s.text
            }
        )
        persons = map(lambda p: schema.Person(id=str(uuid.uuid4()), name=p), extracted_people)
        for p in persons:
            await kindDB.addInstanceByKindName(
                "Person",
                {
                    "id": p.id,
                    "name": p.name
                }
            )
            await kindDB.addLink(
                {
                    "fromKindName":"Sentence",
                    "toKindName":"Person",
                    "relationName":"HasEntity",
                    "fromInstanceId":s.id,
                    "toInstanceId":p.id,
                    "fromFieldName":"text",
                    "toFieldName":"name"
                }
            )


    #
    # await kindDB.addInstanceByKindName(
    #     "Sentence",
    #     {
    #         "id": new_sentence.id,
    #         "text": new_sentence.text
    #     }
    # )



# Handlers


async def handle(event):

    parsed_event = json.loads(event)

    if "linkAdded" in parsed_event.keys():
        return await handle_file(parsed_event)


async def handle_file(blob):

    link_added = blob["linkAdded"]
    link_id = link_added["id"]

    link = await kindDB.getLink(link_id)
    print(json.dumps(link))
    kind = await kindDB.getAllInstances(kindId=link["link"]["toInstance"]["id"])  # the instance id of Kind, aka the kindId
    base = kind.get("allInstances")

    for r in base.get("records"):
        s_id = r[0].get("ID")
        text = r[1].get("STRING")
        sentences = sent_tokenize(text)
        for s in sentences:
            await add_sentence({"id": s_id, "text": s})
            print("Added sentence: " + s)

    return None
