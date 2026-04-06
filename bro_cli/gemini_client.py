from __future__ import annotations

from dataclasses import dataclass

import google.generativeai as genai


@dataclass
class ClientError(Exception):
    message: str
    exit_code: int = 1


class GeminiClient:
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash") -> None:
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(model)

    def ask(self, prompt: str) -> str:
        response = self._model.generate_content(prompt)
        text = getattr(response, "text", None)
        if text and text.strip():
            return text.strip()
        return "No response text returned by Gemini."

    def start_chat(self) -> "GeminiChatSession":
        return GeminiChatSession(self._model.start_chat(history=[]))


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

    return ClientError("Unexpected Gemini error. Please try again.", exit_code=2)
