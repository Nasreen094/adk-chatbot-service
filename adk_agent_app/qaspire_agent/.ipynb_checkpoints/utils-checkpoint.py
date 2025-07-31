import json
from google.cloud import bigquery
from pydantic import BaseModel, Field

PROJECT_ID = "trial-a3839"
DATASET_ID = "bia_qaspire_dummy"
LOCAL_SCHEMA_PATH = "data/qaspire_schema.json"

bq_client = bigquery.Client(project=PROJECT_ID)


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


def load_schema() -> str:
    """Try loading schema from BQ, then local file."""

    # Try BigQuery
    try:
        print("Generating schema from BigQuery...")
        return get_schema_with_samples()
    except Exception as bq_error:
        print(f"BigQuery schema generation failed: {bq_error}")

    # Try local JSON
    try:
        print("Loading schema from local file...")
        with open(LOCAL_SCHEMA_PATH, "r") as f:
            return f.read()
    except Exception as local_error:
        print(f"Local schema load failed: {local_error}")
        raise RuntimeError("Failed to load schema from all sources.")


def execute_query_tool(query: str) -> str:
    """Execute a SQL query against BigQuery and return the results as a JSON string."""

    try:
        result = bq_client.query_and_wait(query)
        r = [dict(row) for row in result]
        return str(json.dumps(str(r)))
    except Exception as e:
        error_message = f"BigQuery Error: {str(e)}"
        return json.dumps({"BigQuery error": error_message})

class SubmitFinalAnswer(BaseModel):
    """
    Represents the final insightful answer submitted by the agent.

    The agent should respond using natural language enriched with appropriate Markdown formatting.
    This can include tables, bullet points, headings, or inline emphasis, based on the type of result.
    """
    final_answer: str = Field(
        ...,
        description=(
            "The final response to present to the user, formatted in **valid Markdown**. "
            "Use Markdown features such as:\n"
            "- Tables (for structured row/column data)\n"
            "- Bullet or numbered lists (for enumerations)\n"
            "- Headings (for organizing sections)\n"
            "- Inline formatting (bold, italic, code spans)\n"
            "- Code blocks (for queries or examples)\n\n"
            "⚠️ If the user requests 'table' explicitly, **generate tabular format markdown.**"
        )
    )
