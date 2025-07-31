from pydantic import BaseModel, Field
import json
from .bq_client import bq_client


def execute_query_tool(query: str) -> str:
    try:
        result = bq_client.query_and_wait(query)
        r = [dict(row) for row in result]
        return str(json.dumps(str(r)))
    except Exception as e:
        error_message = f"BigQuery Error: {str(e)}"
        return json.dumps({"BigQuery error": error_message})

class SubmitFinalAnswer(BaseModel):
    """Submit the final markdown-formatted response to the user."""
    final_answer: str = Field(
        ..., 
        description="Final answer in valid Markdown format. Use tables, bold text, and bullet points as needed."
    )
