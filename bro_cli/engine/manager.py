import time
from typing import List, Optional, Callable, Any
from .planner import Planner
from .worker import Worker
from .memory import KnowledgeBase
from .reflection import Reflection

def retry_call(func: Callable, *args, retries=2, delay=2, **kwargs) -> Any:
    """Simple retry logic for LLM calls."""
    for i in range(retries + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # If it's a critical error or we're out of retries, raise
            if i == retries:
                raise e
            time.sleep(delay * (i + 1))

class Manager:
    def __init__(self, client, kb: KnowledgeBase):
        self.client = client
        self.kb = kb
        self.planner = Planner(client)
        self.worker = Worker(client)
        self.reflection = Reflection(client)

    def start_chat(self) -> "Manager":
        """Compatibility method for interactive mode."""
        return self

    def ask(self, prompt: str) -> str:
        """Compatibility method for interactive mode."""
        return self.run(prompt)

    def run(self, prompt: str) -> str:
        """
        Main agentic loop:
        KB Search -> Plan -> Execute -> Reflect -> Store
        """
        # Clear command history for the new task reset
        if hasattr(self.client, "clear_history"):
            self.client.clear_history()

        # 1. Retrieve relevant context from Knowledge Base
        past_episodes = self.kb.search_episodes(prompt)
        context = ""
        if past_episodes:
            context = "Here are some relevant past experiences:\n"
            for ep in past_episodes:
                context += f"- Prompt: {ep['prompt']}\n  Reflection: {ep['reflection']}\n"

        # 2. Generate hierarchical plan (Subtasks)
        steps = self.planner.plan(prompt, context=context)
        
        # If the planner returns the same prompt, or fails, we fall back to direct execution
        if not steps:
            steps = [prompt]

        # 3. Execute steps sequentially
        # In the future, this could be a DAG with parallel execution or branching
        execution_history = []
        final_response = ""
        
        for i, step in enumerate(steps):
            # We pass previous execution history as context to the worker
            history_context = "\n".join(execution_history[-2:]) # Last 2 steps for context
            
            try:
                # Retry execution of specific steps if they fail due to transient API errors
                result = retry_call(self.worker.execute_step, step, context=history_context)
                execution_history.append(f"Task: {step}\nResult: {result}")
                final_response = result 
            except Exception as e:
                # If a step fails, we stop the plan to avoid cascading errors
                execution_history.append(f"Task: {step}\nFAILED: {str(e)}")
                return f"Task failed at step '{step}': {str(e)}"

        # 4. Reflect on the entire episode (Optional / Non-blocking)
        outcome = "\n".join(execution_history)
        try:
            # Short timeout/no retry for reflection as it's not critical
            summary = self.reflection.reflect(prompt, steps, outcome)
        except Exception:
            summary = "Task completed."

        # 5. Store in Knowledge Base
        try:
            self.kb.add_episode(prompt, steps, outcome, summary)
        except Exception:
            pass # DB errors shouldn't stop the user

        return final_response
