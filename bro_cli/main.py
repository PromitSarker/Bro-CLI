from __future__ import annotations

import argparse
import sys
from typing import Sequence

from .config import get_config_path, prompt_for_api_key, resolve_api_key, save_api_key
from .gemini_client import ClientError, GeminiClient, map_exception


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="bro",
        description="Linux terminal client for chatting with Gemini",
    )
    parser.add_argument("prompt", nargs="*", help="Question to ask Gemini")

    subparsers = parser.add_subparsers(dest="subcommand")
    subparsers.add_parser("config", help="Set or update Gemini API key")
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


def _load_client() -> GeminiClient:
    api_key = resolve_api_key()
    if not api_key:
        raise ClientError(
            "Gemini API key is missing. Run 'bro config' to set it.",
            exit_code=1,
        )
    return GeminiClient(api_key=api_key)


def run_single_prompt(prompt_text: str) -> int:
    try:
        client = _load_client()
        print(client.ask(prompt_text))
        return 0
    except ClientError as exc:
        print(exc.message, file=sys.stderr)
        return exc.exit_code
    except Exception as exc:  # pragma: no cover - defensive layer
        err = map_exception(exc)
        print(err.message, file=sys.stderr)
        return err.exit_code


def run_interactive_chat() -> int:
    try:
        client = _load_client()
        chat = client.start_chat()
    except ClientError as exc:
        print(exc.message, file=sys.stderr)
        return exc.exit_code

    print("Interactive mode. Type 'exit' or 'quit' to leave.")
    while True:
        try:
            user_input = input("bro> ").strip()
        except KeyboardInterrupt:
            print("\nExiting.")
            return 0
        except EOFError:
            print("\nExiting.")
            return 0

        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            print("Exiting.")
            return 0

        try:
            print(chat.ask(user_input))
        except Exception as exc:
            err = map_exception(exc)
            print(err.message, file=sys.stderr)
            return err.exit_code


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.subcommand == "config":
        return run_config()

    if args.prompt:
        return run_single_prompt(" ".join(args.prompt))

    # No prompt and no subcommand means REPL mode.
    return run_interactive_chat()


if __name__ == "__main__":
    raise SystemExit(main())
