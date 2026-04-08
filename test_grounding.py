import os
from google import genai
from google.genai import types

def test_model(model_name):
    # Set the key from the test environment correctly
    api_key = os.environ.get('BRO_GEMINI_KEY') or open('/home/Aether/.config/bro/config.json').read().split('"api_key": "')[1].split('"')[0]
    client = genai.Client(api_key=api_key)

    grounding_tool = types.Tool(
        google_search=types.GoogleSearch()
    )

    config = types.GenerateContentConfig(
        tools=[grounding_tool]
    )

    response = client.models.generate_content(
        model=model_name,
        contents="Who is the current us president?",
        config=config,
    )
    
    print(f"[{model_name}] Text: {response.text}")
    
test_model("gemini-2.5-flash-lite")
# Let's also see what it does if we ask for text manually if text is None
