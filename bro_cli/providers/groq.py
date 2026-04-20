from typing import Callable, Sequence, Dict, Any, List, Optional
from .base import BaseClient
import json
import time

try:
    import groq
    from groq import Groq
except ImportError:  # pragma: no cover
    groq = None
    Groq = None

from .gemini import ClientError, SYSTEM_INSTRUCTION


class GroqClient(BaseClient):
    def __init__(
        self, 
        api_key: str, 
        use_search: bool = False,
        executor_callback: Callable | None = None,
        console: Any = None
    ) -> None:
        if groq is None or Groq is None:
            raise ClientError(
                "Missing dependency: groq. Install bro again with its Python dependencies.",
                exit_code=1,
            )
        self._client = Groq(api_key=api_key, max_retries=3)
        self._use_search = use_search  # Groq does not support google search directly like Gemini yet. We ignore or simulate.
        self._executor = executor_callback
        self._console = console
        self._command_history = [] # Cross-step persistence
        self._current_cwd = None # Tracks state across tool calls
        self._model = "llama-3.3-70b-versatile" # "llama3-8b-8192" or "mixtral-8x7b-32768" are alternatives

    def clear_history(self) -> None:
        """Clear the loop-detection command history for a new task."""
        self._command_history = []

    def ask(self, prompt: str, system_instruction: str | None = None, disable_tools: bool = False) -> str:
        chat = self.start_chat(system_instruction=system_instruction, disable_tools=disable_tools)
        return chat.ask(prompt)

    def start_chat(self, system_instruction: str | None = None, disable_tools: bool = False) -> "GroqChatSession":
        return GroqChatSession(
            client=self._client,
            model=self._model,
            executor=self._executor if not disable_tools else None,
            parent_client=self,
            system_instruction=system_instruction,
            disable_tools=disable_tools
        )


class GroqChatSession:
    def __init__(
        self, 
        client: "Groq", 
        model: str, 
        executor: Callable | None = None, 
        parent_client: Optional["GroqClient"] = None,
        system_instruction: str | None = None,
        disable_tools: bool = False
    ) -> None:
        self._client = client
        self._model = model
        self._executor = executor
        self._parent = parent_client
        self._history = [{"role": "system", "content": system_instruction or SYSTEM_INSTRUCTION}]
        
        self._tools = []
        if self._executor and not disable_tools:
            self._tools.append({
                "type": "function",
                "function": {
                    "name": "execute_terminal_command",
                    "description": "Execute a shell command in the local terminal. Returns stdout and stderr combined.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {
                                "type": "string",
                                "description": "The command to run.",
                            }
                        },
                        "required": ["command"],
                    },
                }
            })

    def _map_groq_exception(self, exc: Exception) -> ClientError:
        raw_message = str(exc).lower()
        if "unauth" in raw_message or "invalid_api_key" in raw_message:
            return ClientError("Groq API key rejected. Run 'bro config' to update your key.", exit_code=1)
        if "rate_limit" in raw_message or "429" in raw_message:
            return ClientError("Rate limited by Groq Cloud. Please retry shortly.", exit_code=2)
        if "503" in raw_message:
            return ClientError("Groq service unavailable. Retry in a moment.", exit_code=2)
        if "connection" in raw_message or "network" in raw_message or "timeout" in raw_message:
            return ClientError("Network error while contacting Groq Cloud.", exit_code=2)
        return ClientError(f"Unexpected Groq error: {exc}", exit_code=2)

    def ask(self, prompt: str) -> str:
        self._history.append({"role": "user", "content": prompt})

        try:
            while True:
                kwargs = {
                    "model": self._model,
                    "messages": self._history,
                    "max_tokens": 3000,
                }
                if self._tools:
                    kwargs["tools"] = self._tools
                    kwargs["tool_choice"] = "auto"
                    
                # We add an internal retry loop for the completion call to handle 
                # transient 429s without restarting the whole tool interaction.
                last_exc = None
                for attempt in range(3):
                    try:
                        if self._parent and self._parent._console:
                            with self._parent._console.status(f"[bold cyan]Bro is thinking...", spinner="dots"):
                                response = self._client.chat.completions.create(**kwargs)
                        else:
                            response = self._client.chat.completions.create(**kwargs)
                        break
                    except Exception as e:
                        last_exc = e
                        raw_msg = str(e).lower()
                        if "rate_limit" in raw_msg or "429" in raw_msg:
                            time.sleep(2 * (attempt + 1))
                            continue
                        raise self._map_groq_exception(e)
                else:
                    if last_exc:
                        raise self._map_groq_exception(last_exc)

                message = response.choices[0].message
                
                if message.content:
                    self._history.append({"role": "assistant", "content": message.content})
                
                tool_calls = message.tool_calls
                if not tool_calls:
                    return message.content or "No response text."

                # Append assistant tool calls request to history
                self._history.append({
                    "role": "assistant",
                    "content": message.content,
                    "tool_calls": [{"id": t.id, "type": "function", "function": {"name": t.function.name, "arguments": t.function.arguments}} for t in tool_calls]
                })

                for call in tool_calls:
                    if call.function.name == "execute_terminal_command" and self._executor:
                        try:
                            args = json.loads(call.function.arguments)
                            command = args.get("command", "")
                            
                            # Detect and break loops
                            if self._parent and command in self._parent._command_history:
                                result = (
                                    f"LOOP DETECTED: You already tried '{command}'. "
                                    "It did not provide the expected result. "
                                    "DO NOT repeat it. Try a different approach or refine your search terms."
                                )
                                new_cwd = self._parent._current_cwd if self._parent else None
                            else:
                                if self._parent:
                                    self._parent._command_history.append(command)
                                cwd = self._parent._current_cwd if self._parent else None
                                result, new_cwd = self._executor(command, cwd=cwd)
                                if self._parent:
                                    self._parent._current_cwd = new_cwd
                        except json.JSONDecodeError:
                            result = "Error parsing JSON arguments."
                            
                        self._history.append({
                            "role": "tool",
                            "tool_call_id": call.id,
                            "name": call.function.name,
                            "content": result,
                        })
                    else:
                        self._history.append({
                            "role": "tool",
                            "tool_call_id": call.id,
                            "name": call.function.name,
                            "content": "Tool not implemented or no executor.",
                        })

                # Prune history if it gets too long for Groq (sliding window)
                if len(self._history) > 15:
                    # Keep system instruction and last 10 messages
                    self._history = [self._history[0]] + self._history[-10:]
        except Exception as e:
            raise self._map_groq_exception(e)
