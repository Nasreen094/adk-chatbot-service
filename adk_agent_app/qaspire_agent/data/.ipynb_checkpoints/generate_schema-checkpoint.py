from fastapi import FastAPI
from google.cloud import bigquery, storage
import vertexai
import json
import datetime
import os

app = FastAPI()

# GCP configs
PROJECT_ID = "trial-a3839"
LOCATION = "us-central1"
DATASET_ID = "bia_qaspire_dummy"
BUCKET_NAME = "run-sources-trial-a3839-us-central1"  
SCHEMA_FILE_NAME = "qaspire_schema.json"

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Initialize BigQuery
bq_client = bigquery.Client(project=PROJECT_ID)


def generate_schema_with_samples() -> str:
    """Returns schema with sample values as JSON string."""
    tables_schema = {}
    tables = bq_client.list_tables(DATASET_ID)

    for table in tables:
        table_ref = f"{table.dataset_id}.{table.table_id}"
        table_obj = bq_client.get_table(table.reference)

        fields = []
        for field in table_obj.schema:
            field_info = {
                "name": field.name,
                "type": field.field_type
            }

            if field.field_type == "STRING" and "date" not in field.name.lower():
                query = f"""
                    SELECT DISTINCT `{field.name}`
                    FROM `{table.project}.{table.dataset_id}.{table.table_id}`
                    WHERE `{field.name}` IS NOT NULL
                    LIMIT 5
                """
                try:
                    query_job = bq_client.query(query)
                    distinct_values = [row[field.name] for row in query_job]
                    field_info["sample_values"] = distinct_values
                except Exception as e:
                    field_info["sample_values"] = [f"Error: {e}"]

            fields.append(field_info)

        # Sample 3 rows
        sample_query = f"""
            SELECT *
            FROM `{table.project}.{table.dataset_id}.{table.table_id}`
            LIMIT 3
        """
        sample_job = bq_client.query(sample_query)
        sample_rows = [dict(row.items()) for row in sample_job]

        tables_schema[table_ref] = {
            "table_name": table_ref,
            "fields": fields,
            "sample_rows": sample_rows
        }

    return json.dumps({"tables": tables_schema}, indent=2)


def save_to_gcs(content: str, bucket_name: str, folder_path: str, file_name: str) -> str:
    """Uploads a file to a GCS folder."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    # Compose full GCS object path
    blob_path = f"{folder_path.rstrip('/')}/{file_name}"

    blob = bucket.blob(blob_path)
    blob.upload_from_string(content, content_type="application/json")
    return f"gs://{bucket_name}/{blob_path}"



@app.get("/generate-schema")
def generate_and_upload_schema():
    try:
        schema_json = generate_schema_with_samples()
        folder = "rawa_artifacts"
        gcs_path = save_to_gcs(schema_json, BUCKET_NAME, folder, SCHEMA_FILE_NAME)
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        local_path = os.path.join(script_dir, SCHEMA_FILE_NAME)

        # Save to local disk
        with open(local_path, "w") as f:
            f.write(schema_json)

        return {
            "message": "Schema saved to both GCS and local disk",
            "gcs_path": gcs_path,
            "local_path": local_path
        }
        
    except Exception as e:
        return {"error": str(e)}

