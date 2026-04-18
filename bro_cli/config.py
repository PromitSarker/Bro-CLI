from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any

ENV_GEMINI_API_KEY = "BRO_GEMINI_KEY"
ENV_GROQ_API_KEY = "BRO_GROQ_KEY"
ENV_PROVIDER = "BRO_PROVIDER"
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


def load_config() -> Dict[str, Any]:
    """Read full config data. Migrates old format if needed."""
    config_path = get_config_path()
    if not config_path.exists():
        return {}

    try:
        with config_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, dict):
                return {}
            # Migration
            if "api_key" in data and "gemini_api_key" not in data:
                data["gemini_api_key"] = data.pop("api_key")
            return data
    except (OSError, json.JSONDecodeError):
        return {}


def save_config(gemini_api_key: Optional[str] = None, groq_api_key: Optional[str] = None, provider: Optional[str] = None) -> Path:
    """Persist settings to config file with mode 0600."""
    config_path = get_config_path()
    config_path.parent.mkdir(parents=True, exist_ok=True)

    data = load_config()
    if gemini_api_key is not None:
        data["gemini_api_key"] = gemini_api_key
    if groq_api_key is not None:
        data["groq_api_key"] = groq_api_key
    if provider is not None:
        data["provider"] = provider

    with config_path.open("w", encoding="utf-8") as f:
        json.dump(data, f)

    os.chmod(config_path, 0o600)
    return config_path


def resolve_api_key(provider: str) -> Optional[str]:
    """Resolve key for provider from env first, then config file."""
    if provider == "gemini":
        env_value = os.environ.get(ENV_GEMINI_API_KEY, "").strip()
        if env_value:
            return env_value
        return load_config().get("gemini_api_key", "").strip() or None
    elif provider == "groq":
        env_value = os.environ.get(ENV_GROQ_API_KEY, "").strip()
        if env_value:
            return env_value
        return load_config().get("groq_api_key", "").strip() or None
    return None

def resolve_provider() -> str:
    """Resolve default provider from env first, then config file, fallback to gemini."""
    env_value = os.environ.get(ENV_PROVIDER, "").strip().lower()
    if env_value in ["gemini", "groq"]:
        return env_value
    
    cfg_value = load_config().get("provider", "").strip().lower()
    if cfg_value in ["gemini", "groq"]:
        return cfg_value
    
    return "gemini"
