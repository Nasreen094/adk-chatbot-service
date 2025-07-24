from google.adk.agents import LlmAgent
from google.genai import types
from google.cloud import bigquery
import vertexai
import json
from pydantic import BaseModel, Field


# Initialize Vertex AI
PROJECT_ID = "trial-a3839"
LOCATION = "us-central1"  # or your region

vertexai.init(project=PROJECT_ID, location=LOCATION)


# Initialize BigQuery
bq_client = bigquery.Client(project=PROJECT_ID)
DATASET_ID= "bia_qaspire_dummy"



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
    # return tables_schema

global schema
schema =get_schema_with_samples()

sys_message = f"""You are "RAWA",an **advanced data analytics agent**, expert in answering questions that users have about the Q-ASPIRE data stored in BigQuery.

Your job is to execute the relevant SQL statements against BigQuery tables to get the best answer.
The user is only interested in seeing the final result from BigQuery.

1. If the user request is reasonable and compatible with the schema, YOU MUST FIRST call the `execute_query_tool`to get the result.
    You will use the following schema for all queries and all SQL must conform to this schema: {schema}
    When generating the SQL query:
    - Use meaningful aliases for column names.
    - Select only necessary columns; avoid SELECT *.
    - Use valid BigQuery SQL (no escape characters).
    - Use only SELECT statements (no DML).

2. Call the `execute_query_tool` tool to execute the generated SQL query. **If the query fails, analyze the error message and attempt to correct the SQL.**  If correction is not possible, inform the user of the error and its likely cause.

3. Only once you have the result from BigQuery, call the `SubmitFinalAnswer` tool to present the final results to the user and terminate the conversation.

If the user request is out of context or irrelevant, call the SubmitFinalAnswer tool to respond politely about your purpose (**To provide insights on QAspire data**) and inform how you can help.**


EXAMPLE:
If a user asks: 'which is the most expensive item on the menu?' you should:
1. Call the execute_query_tool to execute SQL: 'SELECT menu_name, menu_price as price FROM `dataset_name.choc_ai_test.menu` ORDER BY menu_price DESC LIMIT 1'
2. You can then call the SubmitFinalAnswer tool to respond to the user with the result of this query in natural language and end the conversation.

"""

def execute_query_tool(query: str) -> str:
    """Execute a SQL query against BigQuery and return the results as a JSON string."""

    client = bigquery.Client()
    try:
      result = client.query_and_wait(query)
      r = [dict(row) for row in result]
      return str(json.dumps(str(r)))
    except Exception as e:
      error_message = f"BigQuery Error: {str(e)}"
      return json.dumps({"BigQuery error": error_message})

class SubmitFinalAnswer(BaseModel):
    """Represents the final answer submitted by the agent."""

    final_answer: str = Field(..., description="The final answer to submit to the user")



root_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="bigquery_agent",
    description="Answers user questions about bigquery datasets.",
    instruction=sys_message,
    generate_content_config=types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=250
    ),
    tools=[execute_query_tool],
    include_contents='default'
)
