from google.adk.agents import LlmAgent
from google.genai import types
import datetime

from .utils import execute_query_tool, SubmitFinalAnswer
from .prompt import AGENT_INSTRUCTIONS


root_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="bigquery_agent",
    description=(
    "Provides insights on QASPIRE (Qiddiya Asset Strategy Performance and Intelligence Reporting Engine) datasets stored in BigQuery. "
    "Answers analytical questions by generating and executing schema-guided SQL queries, then returns natural language response in mark down format."
),
    instruction=AGENT_INSTRUCTIONS,
    generate_content_config=types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=5000
    ),
    tools=[execute_query_tool, SubmitFinalAnswer],
    include_contents='default'
)

