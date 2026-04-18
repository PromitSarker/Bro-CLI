from abc import ABC, abstractmethod
from typing import Optional, Any

class BaseClient(ABC):
    """Abstract Base Class for all AI providers."""
    
    @abstractmethod
    def ask(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Send a single prompt to the provider and get a string response."""
        pass

    @abstractmethod
    def start_chat(self, system_instruction: Optional[str] = None) -> Any:
        """Start a stateful chat session."""
        pass

    @abstractmethod
    def clear_history(self) -> None:
        """Clear the command/loop history for a new task."""
        pass
