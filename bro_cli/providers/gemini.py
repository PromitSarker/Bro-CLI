from dataclasses import dataclass
from typing import Callable, Sequence, Any, Optional
from .base import BaseClient

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover - depends on local install state
    genai = None
    types = None


SYSTEM_INSTRUCTION = (
    "You are a Linux terminal assistant with a friendly, human-like personality. "
    "Act like a smart, slightly witty buddy who helps efficiently. "
    "Keep responses concise but not robotic. "
    "Try to keep conversation in between 2 to 3 lines. "
    "You may use light humor, casual phrasing, and opinions when appropriate. "
    "Avoid long explanations unless asked. "
    "No markdown formatting for dialogue. Plain text only. "
    "Prioritize clarity and usefulness over strict brevity."
    "Sound like a developer friend, not a documentation page."
    "STRICT RULE: NEVER use Markdown symbols in chat. NO asterisks (*), NO hashtags (#), "
    "NO bold text, NO bullet points using *. "
    "For lists, use plain dashes (-) or simple indentation. "
    "Your output must be pure plain text that looks good in a raw terminal. "
    "You have the capability to execute terminal commands locally on the user's system "
    "using the 'execute_terminal_command' tool. If a task requires checking files, "
    "running scripts, or gathering system info, use this tool. "
    "ALWAYS explain briefly what you are going to do before calling the tool. "
    "The user will be asked for confirmation before each command executes. "
    "CRITICAL: Do NOT say you have finished a task (e.g., 'Done!', 'I created...' ) "
    "unless you have already called the 'execute_terminal_command' tool and it returned success. "
    "If you just talk without calling the tool, the task is NOT done."
)



@dataclass
class ClientError(Exception):
    message: str
    exit_code: int = 1


def execute_terminal_command(command: str) -> str:
    """Execute a shell command in the local terminal. Returns stdout and stderr combined."""
    # This is a placeholder for the tool definition schema. 
    # The actual execution happens via the callback in GeminiClient.
    return ""


class GeminiClient(BaseClient):
    def __init__(
        self, 
        api_key: str, 
        use_search: bool = False,
        executor_callback: Callable | None = None,
        console: Any = None
    ) -> None:
        if genai is None or types is None:
            raise ClientError(
                "Missing dependency: google-genai. Install bro again with its Python dependencies.",
                exit_code=1,
            )
        self._client = genai.Client(api_key=api_key)
        self._use_search = use_search
        self._executor = executor_callback
        self._console = console
        self._command_history = [] # Cross-step persistence
        self._current_cwd = None # Tracks state across tool calls
        # Use a model that supports search for search tasks, and flash-2.0 for agentic tasks.
        # Note: Flash 2.0/3.0 is better at tool calling.
        self._model = "gemini-2.5-flash" if not use_search else "gemini-3-flash-preview"

    def clear_history(self) -> None:
        """Clear the loop-detection command history for a new task."""
        self._command_history = []

    def _get_config(self, system_instruction: str | None = None) -> types.GenerateContentConfig:
        tools = []
        if self._use_search:
            tools.append(types.Tool(google_search=types.GoogleSearch()))
        
        if self._executor:
            tools.append(execute_terminal_command)

        return types.GenerateContentConfig(
            system_instruction=system_instruction or SYSTEM_INSTRUCTION,
            max_output_tokens=3000,
            tools=tools if tools else None,
        )

    def ask(self, prompt: str, system_instruction: str | None = None) -> str:
        # For single prompts, we still want to support tool calling loops.
        # Minimal way is to use a one-off chat session.
        chat = self.start_chat(system_instruction=system_instruction)
        return chat.ask(prompt)

    def start_chat(self, system_instruction: str | None = None) -> "GeminiChatSession":
        return GeminiChatSession(
            self._client.chats.create(
                model=self._model,
                history=[],
                config=self._get_config(system_instruction=system_instruction),
            ),
            executor=self._executor,
            parent_client=self
        )


class GeminiChatSession:
    def __init__(self, chat_session, executor: Callable | None = None, parent_client: GeminiClient | None = None) -> None:
        self._chat_session = chat_session
        self._executor = executor
        self._parent = parent_client

    def ask(self, prompt: str) -> str:
        if self._parent and self._parent._console:
            with self._parent._console.status(f"[bold cyan]Bro is thinking...", spinner="dots"):
                response = self._chat_session.send_message(prompt)
        else:
            response = self._chat_session.send_message(prompt)
        
        while True:
            # Check for tool calls in the response candidates
            tool_calls = []
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if part.function_call:
                        tool_calls.append(part.function_call)

            if not tool_calls:
                break

            # Handle tool calls
            tool_responses = []
            for call in tool_calls:
                if call.name == "execute_terminal_command" and self._executor:
                    command = call.args.get("command")
                    
                    # Detect and break loops
                    if self._parent and command in self._parent._command_history:
                        result = (
                            f"LOOP DETECTED: You already tried '{command}'. "
                            "It did not provide the expected result. "
                            "DO NOT repeat it. Try a different approach or refine your search terms."
                        )
                    else:
                        if self._parent:
                            self._parent._command_history.append(command)
                        # Pass the current CWD from the parent client
                        cwd = self._parent._current_cwd if self._parent else None
                        
                        result, new_cwd = self._executor(command, cwd=cwd)
                        
                        # Update the parent client's CWD for future steps
                        if self._parent:
                            self._parent._current_cwd = new_cwd
                        
                    tool_responses.append(
                        types.Part.from_function_response(
                            name=call.name,
                            response={"result": result}
                        )
                    )
                else:
                    # Unhandled tool call
                    tool_responses.append(
                        types.Part.from_function_response(
                            name=call.name,
                            response={"result": f"Error: Tool {call.name} not implemented or no executor."}
                        )
                    )

            # Send tool responses back to Gemini
            if self._parent and self._parent._console:
                with self._parent._console.status(f"[bold cyan]Bro is thinking...", spinner="dots"):
                    response = self._chat_session.send_message(tool_responses)
            else:
                response = self._chat_session.send_message(tool_responses)

        if response.text:
            return response.text.strip()
        return "No response text after tool execution."


def map_exception(exc: Exception) -> ClientError:
    """Map Gemini SDK and transport errors to stable CLI messages."""
    exc_name = exc.__class__.__name__.lower()
    raw_message = str(exc).lower()

    if "leaked" in raw_message:
        return ClientError(
            "API key was reported as leaked by Google. Generate a new key at aistudio.google.com and run 'bro config'.",
            exit_code=1,
        )

    if "unauth" in exc_name or "permission" in exc_name or "api key" in raw_message or "permission_denied" in raw_message:
        return ClientError("API key rejected. Run 'bro config' to update your key.", exit_code=1)

    if "resourceexhausted" in exc_name or "ratelimit" in raw_message or "429" in raw_message:
        return ClientError("Rate limited by Gemini. Please retry shortly.", exit_code=2)

    if "serviceunavailable" in exc_name or "503" in raw_message:
        return ClientError("Gemini service unavailable. Retry in a moment.", exit_code=2)

    if "connection" in raw_message or "network" in raw_message or "timeout" in raw_message:
        return ClientError("Network error while contacting Gemini.", exit_code=2)

    return ClientError(f"Unexpected Gemini error: {exc}", exit_code=2)
