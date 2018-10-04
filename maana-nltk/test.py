import unittest

from graphene.test import Client

import schema
import resolvers


class TestQueries(unittest.TestCase):

    def test_info(self):
        client = Client(schema.schema)
        executed = client.execute('''{ info { id name description } }''')

        assert executed == {
            'data': {
                'info': {
                    'id': "ab739864-c0ff-40aa-bcdf-972c0bc794dd",
                    'name': 'Maana NLTK service',
                    'description': 'This is a service for using NLTK with MaanaQ'
                }
            }
        }


class TestMethods(unittest.TestCase):

    text_sample = "Andrey punched Alexander for his bad code."

    def test_entity_extract(self):
        entities = resolvers._extract_people(self.text_sample)
        assert entities[0] == 'Andrey'
        assert entities[1] == 'Alexander'


if __name__ == '__main__':
    unittest.main()
