from typing import Optional

class Worker:
    def __init__(self, client):
        """
        client should be an instance of GeminiClient or GroqClient 
        which handles the tool-calling loop for terminal commands.
        """
        self.client = client

    def execute_step(self, step: str, context: Optional[str] = None) -> str:
        """
        Executes a single step of the plan.
        We provide context about previous steps or the overall goal.
        """
        full_instruction = step
        if context:
            full_instruction = f"Context from previous steps: {context}\n\nCurrent Task: {step}"
        
        # The client's 'ask' method already handles the 'execute_terminal_command' 
        # tool loop and user confirmations.
        return self.client.ask(full_instruction)
