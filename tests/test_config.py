from __future__ import annotations

import os
import stat

from bro_cli.config import (
    ENV_API_KEY,
    get_config_path,
    load_api_key_from_file,
    resolve_api_key,
    save_api_key,
)


def test_save_and_load_api_key(tmp_path, monkeypatch):
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))

    saved_path = save_api_key("test-key")
    assert saved_path == get_config_path()
    assert load_api_key_from_file() == "test-key"


def test_config_file_permissions_are_user_only(tmp_path, monkeypatch):
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))

    path = save_api_key("key")
    mode = stat.S_IMODE(path.stat().st_mode)
    assert mode == 0o600


def test_env_key_overrides_config(tmp_path, monkeypatch):
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
    save_api_key("file-key")
    monkeypatch.setenv(ENV_API_KEY, "env-key")

    assert resolve_api_key() == "env-key"


def test_resolve_returns_none_when_missing(tmp_path, monkeypatch):
    monkeypatch.setenv("XDG_CONFIG_HOME", str(tmp_path))
    monkeypatch.delenv(ENV_API_KEY, raising=False)

    assert resolve_api_key() is None
