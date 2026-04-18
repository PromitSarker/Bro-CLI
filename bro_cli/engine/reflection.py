from typing import List

REFLECTION_SYSTEM_PROMPT = """
You are the Reflection Module of Bro-CLI.
Your task is to analyze task execution history and provided a 2-3 line summary focusing on success and key commands used.
Keep it professional and factual. No conversational fluff or markdown bolding/italics.
"""

REFLECTION_PROMPT = """
Analyze the following task:
Original User Request: {prompt}
Plan Steps: {steps}
Final Outcome: {outcome}
"""

class Reflection:
    def __init__(self, client):
        self.client = client

    def reflect(self, prompt: str, steps: List[str], outcome: str) -> str:
        formatted_prompt = REFLECTION_PROMPT.format(
            prompt=prompt,
            steps=", ".join(steps),
            outcome=outcome
        )
        
        return self.client.ask(formatted_prompt, system_instruction=REFLECTION_SYSTEM_PROMPT)
