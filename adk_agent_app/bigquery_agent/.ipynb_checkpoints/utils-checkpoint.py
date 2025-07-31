from pydantic import BaseModel, Field
import json
from .bq_client import bq_client
from .config import DATASET_ID

def get_schema_with_samples() -> str:
    """Retrieves BigQuery schema with unique string values and 3 sample rows for each table."""

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

            # If STRING, get top 5 distinct sample values
            if field.field_type == "STRING" and "date" not in field.name.lower():

                query = f"""
                    SELECT DISTINCT `{field.name}`
                    FROM `{table.project}.{table.dataset_id}.{table.table_id}`
                    WHERE `{field.name}` IS NOT NULL

                """
                query_job = bq_client.query(query)
                distinct_values = [row[field.name] for row in query_job]
                field_info["sample_values"] = distinct_values

            fields.append(field_info)

        # Get 3 sample rows
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
   
