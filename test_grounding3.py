import os
from google import genai
from google.genai import types

def test_model(model_name):
    # Set the key from the test environment correctly
    api_key = os.environ.get('BRO_GEMINI_KEY') or open('/home/Aether/.config/bro/config.json').read().split('"api_key": "')[1].split('"')[0]
    client = genai.Client(api_key=api_key)

    config = types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents="Who won the euro 2024?",
            config=config,
        )
        print(f"[{model_name}] Text: {response.text}")
    except Exception as e:
        print(f"[{model_name}] Error: {e}")
    
test_model("gemini-1.5-flash")
