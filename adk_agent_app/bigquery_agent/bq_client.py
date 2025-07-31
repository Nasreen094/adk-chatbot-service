from google.cloud import bigquery
from .config import PROJECT_ID

bq_client = bigquery.Client(project=PROJECT_ID)
