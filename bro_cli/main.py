import argparse
import sys
from typing import Sequence, Optional

# UI & Formatting
from .ui.terminal import console, Prompt, print_panel, Panel

# Configuration
from .config import (
    get_config_path, resolve_api_key, save_config, 
    resolve_provider, load_config
)

# Engine & Utilities
from .engine.manager import Manager
from .engine.memory import KnowledgeBase
from .utils.shell import run_and_confirm_command

# Providers
from .providers.gemini import GeminiClient, map_exception as gemini_map_exception, ClientError as GeminiClientError
from .providers.groq import GroqClient, ClientError as GroqClientError

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bro",
        description="Your AI Bro in the terminal.",
    )
    parser.add_argument("-s", "--search", action="store_true", help="Enable web search capability")
    parser.add_argument("-p", "--provider", choices=["gemini", "groq"], help="Choose AI provider")
    parser.add_argument("command", nargs="?", help="Subcommand or prompt")
    parser.add_argument("prompt", nargs=argparse.REMAINDER, help="User prompt")
    return parser

def run_config() -> int:
    while True:
        config_data = load_config()
        existing_gemini = config_data.get("gemini_api_key")
        existing_groq = config_data.get("groq_api_key")
        existing_provider = config_data.get("provider", "gemini")

        console.print("\n")
        console.print(Panel.fit(
            f"Default AI: [bold cyan]{existing_provider.upper()}[/bold cyan]\n"
            f"Gemini Key: {'[bold green]VALID[/bold green]' if existing_gemini else '[bold red]NOT SET[/bold red]'}\n"
            f"Groq Key:   {'[bold green]VALID[/bold green]' if existing_groq else '[bold red]NOT SET[/bold red]'}\n",
            title="[bold]Bro-CLI Settings[/bold]",
            border_style="cyan"
        ))

        console.print("[1] [bold cyan]Switch Default AI[/bold cyan]")
        console.print("[2] [bold cyan]Manage API Credentials[/bold cyan]")
        console.print("[3] [bold cyan]Exit[/bold cyan]")
        
        choice = Prompt.ask("\nChoose an option", choices=["1", "2", "3"], default="3")

        if choice == "3":
            break

        if choice == "1":
            new_provider = Prompt.ask("Choose default provider", choices=["gemini", "groq"], default=existing_provider)
            config_data["provider"] = new_provider
            save_config(**config_data)
        elif choice == "2":
            console.print("[warning]Press Enter to keep current keys or skip.[/warning]")
            gemini_key = Prompt.ask("Gemini API key", password=True, default=existing_gemini or "")
            groq_key = Prompt.ask("Groq Cloud API key", password=True, default=existing_groq or "")
            
            # If the user enters empty string, we want to save it as empty or keep existing?
            # It already has the default filled in if it was existing.
            config_data.update({"gemini_api_key": gemini_key, "groq_api_key": groq_key})
            save_config(**config_data)
            console.print("[success]Credentials saved![/success]")

    return 0

def _load_agent(use_search: bool = False, provider: str | None = None):
    provider = provider or resolve_provider()
    api_key = resolve_api_key(provider)
    
    if not api_key:
        raise GeminiClientError(f"API key for '{provider}' missing. Run 'bro config'.", exit_code=1)
    
    # Initialize Provider
    if provider == "groq":
        client = GroqClient(api_key=api_key, use_search=use_search, executor_callback=run_and_confirm_command, console=console)
    else:
        client = GeminiClient(api_key=api_key, use_search=use_search, executor_callback=run_and_confirm_command, console=console)
    
    # Initialize Engine
    db_path = get_config_path().parent / "knowledge.db"
    return Manager(client, KnowledgeBase(db_path))

def run_task(prompt_text: str, agent=None, use_search: bool = False, provider: str | None = None) -> int:
    try:
        if agent is None:
            agent = _load_agent(use_search=use_search, provider=provider)
        response = agent.run(prompt_text)
        print_panel(response, title=f"Bro ({provider or resolve_provider()})")
        return 0
    except (GeminiClientError, GroqClientError) as exc:
        console.print(f"[error]✗ {exc.message}[/error]")
        return getattr(exc, "exit_code", 1)
    except Exception as exc:
        console.print(f"\n[error]💥 Fatal system error:[/error] {type(exc).__name__}")
        console.print(f"[dim]{str(exc).splitlines()[0]}[/dim]\n")
        return 1

def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "config":
        return run_config()

    prompt = " ".join([args.command, *args.prompt]).strip() if args.command else None
    
    if prompt:
        return run_task(prompt, use_search=args.search, provider=args.provider)
    
    # REPL Mode
    console.print(f"[info]Bro-CLI Interactive Mode. Type 'exit' to leave.[/info]")
    
    # Load agent once for the whole interactive session.
    try:
        agent = _load_agent(use_search=args.search, provider=args.provider)
    except (GeminiClientError, GroqClientError) as exc:
        console.print(f"[error]{exc.message}[/error]")
        return exc.exit_code

    while True:
        try:
            line = Prompt.ask("[prompt]bro[/prompt]")
            if not line:
                continue
            if line.lower() in {"exit", "quit"}: break
            run_task(line, agent=agent, use_search=args.search, provider=args.provider)
        except (KeyboardInterrupt, EOFError):
            break
    return 0

if __name__ == "__main__":
    sys.exit(main())
