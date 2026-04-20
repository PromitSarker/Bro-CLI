import time
from typing import List, Optional, Callable, Any
from .planner import Planner
from .worker import Worker
from .memory import KnowledgeBase
from .reflection import Reflection

def retry_call(func: Callable, *args, retries=3, delay=1.0, max_delay=10.0, **kwargs) -> Any:
    """Retry logic for LLM calls with exponential backoff."""
    for i in range(retries + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # If it's the last attempt, raise the error
            if i == retries:
                raise e
            
            # Exponential backoff: delay * 2^i
            sleep_time = min(delay * (2 ** i), max_delay)
            # Add a small jitter if multiple clients were expected, 
            # but here even a simple sleep is better than static.
            time.sleep(sleep_time)

class Manager:
    def __init__(self, client, kb: KnowledgeBase):
        self.client = client
        self.kb = kb
        self.planner = Planner(client)
        self.worker = Worker(client)
        self.reflection = Reflection(client)
        self._interactive_chat = None

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
        if self._interactive_chat is None:
            self._interactive_chat = self.client.start_chat()

        # Clear command history for the new task reset
        if hasattr(self.client, "clear_history"):
            self.client.clear_history()

        # --- FAST PATH: Conversational Queries ---
        # If the prompt is very short or matches common greeting patterns, 
        # we bypass the planning/reflection loop to save time and tokens.
        clean_prompt = prompt.strip().lower()
        is_greeting = clean_prompt in {"hi", "hello", "hey", "sup", "yo", "help", "who are you"}
        is_short = len(clean_prompt) < 20 and not any(c in clean_prompt for c in {"/", ".", "-", "_", "mkdir", "git", "cd"})

        if is_greeting or is_short:
            return self._interactive_chat.ask(prompt)

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

        # Let the user know the plan
        from bro_cli.ui.terminal import console
        if len(steps) > 1 and steps[0] != prompt:
            console.print(f"[bold info]Bro configured a {len(steps)}-step plan:[/bold info]")
            for idx, s in enumerate(steps, 1):
                console.print(f"[dim]  {idx}. {s}[/dim]")
            console.print("")

        # 3. Execute steps sequentially
        # In the future, this could be a DAG with parallel execution or branching
        execution_history = []
        final_response = ""
        
        for i, step in enumerate(steps):
            # We pass previous execution history as context to the worker
            history_context = "\n".join(execution_history[-2:]) # Last 2 steps for context
            
            try:
                # Execution should be in the interactive_chat context!
                full_instruction = step
                if history_context:
                    full_instruction = f"Context from previous steps:\n{history_context}\n\nCurrent Task: {step}"
                
                result = retry_call(self._interactive_chat.ask, full_instruction)
                execution_history.append(f"Task: {step}\nResult: {result}")
                final_response = result 
            except Exception as e:
                # If a step fails, we stop the plan to avoid cascading errors
                execution_history.append(f"Task: {step}\nFAILED: {str(e)}")
                return f"Task failed at step '{step}': {str(e)}"

        # 4. Reflect on the entire episode (Optional / Non-blocking)
        # We only reflect if the task actually involved terminal commands 
        # to save tokens on informational queries.
        outcome = "\n".join(execution_history)
        has_commands = hasattr(self.client, "_command_history") and len(self.client._command_history) > 0
        
        if not has_commands:
            summary = "Task completed."
        else:
            try:
                # Short timeout/no retry for reflection as it's not critical
                summary = self.reflection.reflect(prompt, steps, outcome)
            except Exception:
                summary = "Task completed."

        # 5. Store in Knowledge Base
        try:
            # Only store if it was a real task (more than 1 step or has commands)
            if len(steps) > 1 or has_commands:
                self.kb.add_episode(prompt, steps, outcome, summary)
        except Exception:
            pass # DB errors shouldn't stop the user

        return final_response
