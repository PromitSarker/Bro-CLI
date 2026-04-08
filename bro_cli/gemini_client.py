from __future__ import annotations

from dataclasses import dataclass

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
    "You may use light humor, casual phrasing, and opinions when appropriate. "
    "Avoid long explanations unless asked. "
    "No markdown formatting. Plain text only. "
    "Prioritize clarity and usefulness over strict brevity."
    "Sound like a developer friend, not a documentation page."
)


@dataclass
class ClientError(Exception):
    message: str
    exit_code: int = 1


class GeminiClient:
    def __init__(self, api_key: str, use_search: bool = False) -> None:
        if genai is None or types is None:
            raise ClientError(
                "Missing dependency: google-genai. Install bro again with its Python dependencies.",
                exit_code=1,
            )
        self._client = genai.Client(api_key=api_key)
        self._use_search = use_search
        # Use a model that supports search for search tasks, and lite for normal tasks.
        self._model = "gemini-3-flash-preview" if use_search else "gemini-2.5-flash-lite"

    def _get_config(self) -> types.GenerateContentConfig:
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            max_output_tokens=3000,  # Enforce brevity at the API level
        )
        if self._use_search:
            config.tools = [
                types.Tool(
                    google_search=types.GoogleSearch()
                )
            ]
        return config

    def ask(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=self._get_config(),
        )
        text = getattr(response, "text", None)
        if text and text.strip():
            return text.strip()
        return "No response text returned by Gemini."

    def start_chat(self) -> "GeminiChatSession":
        return GeminiChatSession(
            self._client.chats.create(
                model=self._model,
                history=[],
                config=self._get_config(),
            )
        )


class GeminiChatSession:
    def __init__(self, chat_session) -> None:
        self._chat_session = chat_session

    def ask(self, prompt: str) -> str:
        response = self._chat_session.send_message(prompt)
        text = getattr(response, "text", None)
        if text and text.strip():
            return text.strip()
        return "No response text returned by Gemini."


def map_exception(exc: Exception) -> ClientError:
    """Map Gemini SDK and transport errors to stable CLI messages."""
    exc_name = exc.__class__.__name__.lower()
    raw_message = str(exc).lower()

    if "unauth" in exc_name or "permission" in exc_name or "api key" in raw_message:
        return ClientError("API key rejected. Run 'bro config' to update it.", exit_code=1)

    if "resourceexhausted" in exc_name or "ratelimit" in raw_message or "429" in raw_message:
        return ClientError("Rate limited by Gemini. Please retry shortly.", exit_code=2)

    if "serviceunavailable" in exc_name or "503" in raw_message:
        return ClientError("Gemini service unavailable. Retry in a moment.", exit_code=2)

    if "connection" in raw_message or "network" in raw_message or "timeout" in raw_message:
        return ClientError("Network error while contacting Gemini.", exit_code=2)

    return ClientError(f"Unexpected Gemini error: {exc}", exit_code=2)
