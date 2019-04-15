import os
import sys
import json
import requests
import logging
import asyncio
import aiohttp
import datetime
from auth0.v3.authentication import GetToken
from settings import LOG_LEVEL

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=LOG_LEVEL)


class CKGClient:

    def __init__(self, service_url, loop=asyncio.get_event_loop()):

        self.service_url = service_url

        domain = os.getenv('REACT_APP_PORTAL_AUTH_DOMAIN')
        self.c_id = os.getenv('REACT_APP_PORTAL_AUTH_CLIENT_ID')
        self.secret = os.getenv('REACT_APP_PORTAL_AUTH_CLIENT_SECRET')
        self.identifier = os.getenv('REACT_APP_PORTAL_AUTH_IDENTIFIER')

        try:
            self.getter = GetToken(domain)
            token = self.getter.client_credentials(client_id=self.c_id,
                                                   client_secret=self.secret,
                                                   audience=self.identifier)

            self.token = token['access_token']
            self.expires = token['expires_in']
            expiration_time = '{}d {}h:{}m:{}s'.format(self.expires // 86400,
                                                       (self.expires %
                                                        86400) // 3600,
                                                       (self.expires %
                                                        3600) // 60,
                                                       self.expires % 60)
            self.renewal_time_hours = .5 * (self.expires // 3600)
            logger.info("Token expires in {}".format(expiration_time))
            self.headers = {
                "Content-Type": "application/json",
                "authorization": "Bearer " + self.token
            }
            self.session = aiohttp.ClientSession(loop=loop)
            asyncio.ensure_future(self.renewal(
                self.renewal_time_hours * 60 * 60))
        except Exception as e:
            logger.error("Unable to connect to Maana {}".format(service_url))
            pass

    async def renewal(self, initial_wait_time):
        await asyncio.sleep(initial_wait_time)
        while True:
            token = self.getter.client_credentials(client_id=self.c_id,
                                                   client_secret=self.secret,
                                                   audience=self.identifier)
            self.token = token['access_token']
            self.expires = token['expires_in']
            temp = self.headers
            temp['authorization'] = "Bearer " + self.token
            self.headers = temp
            self.renewal_time_hours = .5 * (self.expires // 3600)
            await asyncio.sleep(self.renewal_time_hours * 60 * 60)

    def query(self, query, variables=None):
        final = {
            "query": query,
            "variables": variables
        }
        out = requests.post(self.service_url, headers=self.headers, json=final)
        if out.status_code == 200:
            return out.json()
        else:
            logger.error("Query failed! Code: {}\nText: {}".format(
                out.status_code, out.text))
            return None

    async def async_query(self, query, variables=None):

        final = {
            "query": query,
            "variables": variables
        }
        resp = await self.session.post(self.service_url, data=json.dumps(final), headers=self.headers)

        if resp.status == 200:
            return await resp.json()
        else:
            logger.error("Query failed! Code: {}".format(resp.status))
            return None
