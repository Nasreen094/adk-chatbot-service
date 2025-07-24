from google.adk.agents import LlmAgent
from google.genai import types


def get_population(country: str) -> str:
    populations = {
        "france": "approximately 67 million",
        "japan": "approximately 125 million",
        "canada": "approximately 39 million"
    }
    return populations.get(country.lower(), f"Sorry, I don't know the population of {country}.")


root_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="population_agent",
    description="Answers user questions about the population of a given country.",
    instruction="""You are an agent that provides the population of a country.
When a user asks for the population of a country:
1. Identify the country name from the user's query.
2. Use the `get_population` tool to retrieve the population.
3. Respond clearly to the user, stating the population.
Example Query: "What is the population of Japan?"
Example Response: "The population of Japan is approximately 125 million."
""",
    generate_content_config=types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=250
    ),
    tools=[get_population],
    include_contents='default'
)