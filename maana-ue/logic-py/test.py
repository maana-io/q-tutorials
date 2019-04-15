import unittest

from graphene.test import Client

import schema


class TestQueries(unittest.TestCase):

    def test_info(self):
        client = Client(schema.schema)
        executed = client.execute('''{ info { id name description } }''')
        assert executed == {
            'data': {
                'info': {
                    'id': '7560bd6b-6a7f-45f9-97e5-38ee65982ae5',
                    'name': 'Maana Python Template',
                    'description': 'This is a python template for using MaanaQ.'
                }
            }
        }


if __name__ == '__main__':
    unittest.main()
