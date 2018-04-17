import requests


class BaseQueryClass:
    url = ""

    def __init__(self):
        self.url = 'http://138.91.199.6:8003/workspace/42376604-0bf6-4866-9348-506ed3f6b6a5/graphql'
        self.query = ""

    def run_query(self, query):
        request = requests.post(self.url, json={'query': query})
        if request.status_code == 200:
            return request.json()
        else:
            raise Exception("Query failed to run by returning code of {}. {}".format(request.status_code, query))