import json
from typing import List, Optional

PLANNER_SYSTEM_PROMPT = """
You are the Planning Module of Bro-CLI, a hierarchical AI agent.
Your goal is to take a complex user instruction and decompose it into a sequence of atomic, logical steps.

Rules:
1. Return ONLY a JSON list of strings.
2. Every item in the list MUST be a specific terminal command or an atomic action.
3. Use 'cd' commands when you need subsequent commands to run in a specific directory.
4. Be specific and concise. Do NOT include conversation or markdown formatting.
5. PRESERVE SEARCH TERMS: If a user asks to find "Laboratory", do NOT search for "*.py" or other unrelated patterns. Search for the EXACT term provided.
6. FOLDER SEARCH: When searching for a "folder" or "directory", use folder-specific flags like `find . -type d -name "NAME" 2>/dev/null`.

Example:
User: "Create a new git repo in a folder called 'project' and add a readme"
Output: ["mkdir project", "cd project", "git init", "echo '# Project' > README.md", "git add README.md", "git commit -m 'Initial commit'"]

User: "Find Laboratory folder on the whole system"
Output: ["df -h", "find /home/$(whoami) -type d -name 'Laboratory' 2>/dev/null", "locate -i Laboratory"]
"""

class Planner:
    def __init__(self, client):
        """
        client should be an instance of GeminiClient or GroqClient 
        that has an 'ask' method.
        """
        self.client = client

    def plan(self, prompt: str, context: Optional[str] = None) -> List[str]:
        full_prompt = PLANNER_SYSTEM_PROMPT
        if context:
            full_prompt += f"\n\nContext from Knowledge Base:\n{context}"
        
        full_prompt += f"\n\nUser Instruction: {prompt}\n\nPlan (JSON list):"
        
        try:
            # We use the client to generate the plan. 
            # We override the system instruction to be strict and logic-focused.
            response = self.client.ask(full_prompt, system_instruction=PLANNER_SYSTEM_PROMPT)
            
            # Try to find JSON in the response if the LLM added fluff
            start = response.find("[")
            end = response.rfind("]") + 1
            if start != -1 and end != -1:
                return json.loads(response[start:end])
            return [prompt] # Fallback to original prompt if parsing fails
        except Exception:
            # If planning fails for ANY reason (rate limit, etc.), 
            # we just return the original prompt as a single step.
            return [prompt]
