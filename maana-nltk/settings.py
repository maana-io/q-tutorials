import os
from dotenv import load_dotenv
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
load_dotenv(verbose=True, dotenv_path=os.path.join(PROJECT_ROOT, '.env'))
SOLVERS_DIR = os.path.join(PROJECT_ROOT, "solvers")
RESULTS_DIR = os.path.join(PROJECT_ROOT, "results")
KINDDB_SERVICE_URL = os.getenv('KINDDB_KSVC_ENDPOINT_URL', 'http://localhost:8008/graphql')
SERVICE_ID = os.getenv('SERVICE_ID')
SERVICE_ADDRESS = '0.0.0.0'
SERVICE_PORT = os.getenv('PORT')
RABBITMQ_ADDR = os.getenv('RABBITMQ_ADDR')
RABBITMQ_PORT = os.getenv('RABBITMQ_PORT')

REACT_APP_PORTAL_AUTH_DOMAIN = os.getenv('REACT_APP_PORTAL_AUTH_DOMAIN')
REACT_APP_PORTAL_AUTH_CLIENT_ID = os.getenv('REACT_APP_PORTAL_AUTH_CLIENT_ID')
REACT_APP_PORTAL_AUTH_CLIENT_SECRET = os.getenv('REACT_APP_PORTAL_AUTH_CLIENT_SECRET')
REACT_APP_PORTAL_AUTH_IDENTIFIER = os.getenv('REACT_APP_PORTAL_AUTH_IDENTIFIER')