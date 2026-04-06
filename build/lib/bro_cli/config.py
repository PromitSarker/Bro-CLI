from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

ENV_API_KEY = "BRO_GEMINI_KEY"
_CONFIG_DIR_NAME = "bro"
_CONFIG_FILE_NAME = "config.json"


def get_config_path() -> Path:
    """Return the Linux-friendly config path for bro."""
    xdg_config_home = os.environ.get("XDG_CONFIG_HOME")
    if xdg_config_home:
        base_dir = Path(xdg_config_home)
    else:
        base_dir = Path.home() / ".config"
    return base_dir / _CONFIG_DIR_NAME / _CONFIG_FILE_NAME


def prompt_for_api_key() -> str:
    """Prompt user for API key until a non-empty value is provided."""
    while True:
        value = input("Enter your Gemini API key: ").strip()
        if value:
            return value
        print("API key cannot be empty.")


def save_api_key(api_key: str) -> Path:
    """Persist API key to config file with mode 0600."""
    config_path = get_config_path()
    config_path.parent.mkdir(parents=True, exist_ok=True)

    with config_path.open("w", encoding="utf-8") as f:
        json.dump({"api_key": api_key}, f)

    os.chmod(config_path, 0o600)
    return config_path


def load_api_key_from_file() -> Optional[str]:
    """Read API key from config file when available and valid."""
    config_path = get_config_path()
    if not config_path.exists():
        return None

    try:
        with config_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None

    value = data.get("api_key") if isinstance(data, dict) else None
    if not value or not isinstance(value, str):
        return None
    return value.strip() or None


def resolve_api_key() -> Optional[str]:
    """Resolve key from env first, then config file."""
    env_value = os.environ.get(ENV_API_KEY, "").strip()
    if env_value:
        return env_value
    return load_api_key_from_file()
