import argparse
import subprocess
import sys
from typing import Sequence

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt
from rich.theme import Theme

from .config import get_config_path, prompt_for_api_key, resolve_api_key, save_api_key
from .gemini_client import ClientError, GeminiClient, map_exception

# Professional Cyberpunk Theme
custom_theme = Theme({
    "info": "cyan",
    "warning": "yellow",
    "error": "bold red",
    "prompt": "bold green",
    "ai_name": "bold magenta",
})
console = Console(theme=custom_theme)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bro",
        description="Linux terminal client for chatting with Gemini",
    )
    parser.add_argument(
        "-s",
        "--search",
        action="store_true",
        help="Enable web search capability (grounding)",
    )
    parser.add_argument(
        "command",
        nargs="?",
        help="Use config to set the API key, or provide a prompt to chat",
    )
    parser.add_argument(
        "prompt",
        nargs=argparse.REMAINDER,
        help="Question to ask Gemini",
    )
    return parser


def run_config() -> int:
    existing = resolve_api_key()
    if existing:
        print("An API key is already configured. Saving will overwrite the stored key.")

    api_key = prompt_for_api_key()
    path = save_api_key(api_key)
    print("API key saved.")
    print(f"Config file: {path}")
    return 0


def run_and_confirm_command(command: str) -> str:
    """Callback to display, confirm, and execute a command."""
    console.print(Panel(
        f"[bold yellow]$ {command}[/bold yellow]",
        title="[warning]Proposed Command[/warning]",
        title_align="left",
        border_style="yellow",
        padding=(0, 1)
    ))
    
    if not Confirm.ask("[prompt]Execute this command?[/prompt]", default=False):
        return "User refused to execute the command."

    try:
        # Use shell=True to allow pipes and redirections
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            check=False
        )
        output = result.stdout + result.stderr
        if not output.strip():
            output = "(Command executed with no output)"
        
        # Optionally show output to user too? 
        # Usually Bro will summarize it, but seeing it is good.
        if output.strip():
            console.print("[dim]Output snippet:[/dim]")
            snippet = output.strip()[:500] + ("..." if len(output) > 500 else "")
            console.print(f"[dim]{snippet}[/dim]")
            
        return output
    except Exception as e:
        return f"Error executing command: {str(e)}"


def _load_client(use_search: bool = False, agentic: bool = True) -> GeminiClient:
    api_key = resolve_api_key()
    if not api_key:
        raise ClientError(
            "Gemini API key is missing. Run 'bro config' to set it.",
            exit_code=1,
        )
    
    executor = run_and_confirm_command if agentic else None
    return GeminiClient(api_key=api_key, use_search=use_search, executor_callback=executor)


def run_single_prompt(prompt_text: str, use_search: bool = False) -> int:
    try:
        client = _load_client(use_search=use_search)
        with console.status("[bold cyan]Bro is thinking...", spinner="dots"):
            response = client.ask(prompt_text)
        
        console.print(Panel(
            response,
            title="[ai_name]Bro",
            title_align="left",
            border_style="magenta",
            padding=(1, 2)
        ))
        return 0
    except ClientError as exc:
        console.print(f"[error]{exc.message}[/error]", style="red")
        return exc.exit_code
    except Exception as exc:  # pragma: no cover - defensive layer
        err = map_exception(exc)
        console.print(f"[error]{err.message}[/error]", style="red")
        return err.exit_code


def run_interactive_chat(use_search: bool = False) -> int:
    try:
        client = _load_client(use_search=use_search)
        chat = client.start_chat()
    except ClientError as exc:
        console.print(f"[error]{exc.message}[/error]")
        return exc.exit_code

    mode_info = " [dim](Search enabled)[/dim]" if use_search else ""
    console.print(f"[info]Interactive mode{mode_info}. Type 'exit' or 'quit' to leave.[/info]")
    
    while True:
        try:
            # Styled prompt using rich.prompt.Prompt or just console.print
            user_input = Prompt.ask("[prompt]bro[/prompt]")
        except (KeyboardInterrupt, EOFError):
            console.print("\n[info]Exiting. Catch ya later![/info]")
            return 0

        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            console.print("[info]Exiting. Catch ya later![/info]")
            return 0

        try:
            with console.status("[bold cyan]Thinking...", spinner="dots"):
                response = chat.ask(user_input)
            
            console.print(Panel(
                response,
                title="[ai_name]Bro",
                title_align="left",
                border_style="magenta",
                padding=(1, 2)
            ))
        except Exception as exc:
            err = map_exception(exc)
            console.print(f"[error]{err.message}[/error]")
            return err.exit_code


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "config" and not args.prompt:
        return run_config()

    if args.command == "config" and args.prompt:
        parser.error("'config' does not accept a chat prompt")

    if args.command is not None:
        prompt_parts = [args.command, *args.prompt]
        return run_single_prompt(" ".join(prompt_parts).strip(), use_search=args.search)

    # No prompt and no subcommand means REPL mode.
    return run_interactive_chat(use_search=args.search)


if __name__ == "__main__":
    raise SystemExit(main())
