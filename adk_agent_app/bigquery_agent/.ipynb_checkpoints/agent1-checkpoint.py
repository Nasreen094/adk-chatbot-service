from google.adk.agents import LlmAgent
from google.genai import types
from .utils import get_schema_with_samples
from .prompts import build_system_prompt
from .tools import execute_query_tool, SubmitFinalAnswer


schema = get_schema_with_samples()
sys_prompt = build_system_prompt(schema)


root_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="bigquery_agent",
    description="Answers user questions about Q-ASPIRE data",
    instruction=sys_prompt,
    generate_content_config=types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=3000
    ),
    tools=[execute_query_tool, SubmitFinalAnswer],
    include_contents='default'
)
