import sys
from bro_cli.config import resolve_api_key, resolve_provider, load_config
from bro_cli.providers.groq import GroqClient
from bro_cli.engine.planner import Planner

provider = resolve_provider()
api_key = resolve_api_key(provider)
client = GroqClient(api_key=api_key)
planner = Planner(client)

plan = planner.plan("Create a new folder called my_test, cd into it, and initialize git")
print("PLAN:", plan)
