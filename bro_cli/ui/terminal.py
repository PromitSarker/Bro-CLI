from rich.console import Console
from rich.theme import Theme
from rich.panel import Panel
from rich.prompt import Confirm, Prompt

# Professional Cyberpunk Theme
custom_theme = Theme({
    "info": "cyan",
    "warning": "yellow",
    "error": "bold red",
    "prompt": "bold green",
    "ai_name": "bold magenta",
    "success": "bold green",
})

console = Console(theme=custom_theme)

def print_panel(content: str, title: str = "Bro", border_style: str = "magenta"):
    """Helper to print a consistent rich panel."""
    console.print(Panel(
        content,
        title=title,
        title_align="left",
        border_style=border_style,
        padding=(1, 2)
    ))

def print_command_panel(command: str):
    """Specific panel for proposed terminal commands."""
    console.print(Panel(
        f"[bold yellow]$ {command}[/bold yellow]",
        title="[warning]Proposed Command[/warning]",
        title_align="left",
        border_style="yellow",
        padding=(0, 1)
    ))
