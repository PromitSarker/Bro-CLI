from __future__ import annotations

from bro_cli import main as cli


class _FakeChat:
    def ask(self, prompt: str) -> str:
        return f"chat:{prompt}"


class _FakeClient:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def ask(self, prompt: str) -> str:
        return f"answer:{prompt}"

    def start_chat(self):
        return _FakeChat()


def test_config_command_saves_key(monkeypatch, capsys):
    monkeypatch.setattr(cli, "resolve_api_key", lambda: None)
    monkeypatch.setattr(cli, "prompt_for_api_key", lambda: "new-key")
    monkeypatch.setattr(cli, "save_api_key", lambda k: "/tmp/bro/config.json")

    code = cli.main(["config"])
    out = capsys.readouterr().out

    assert code == 0
    assert "API key saved." in out


def test_single_prompt_flow(monkeypatch, capsys):
    monkeypatch.setattr(cli, "resolve_api_key", lambda: "abc")
    monkeypatch.setattr(cli, "GeminiClient", _FakeClient)

    code = cli.main(["what", "is", "linux"])
    out = capsys.readouterr().out.strip()

    assert code == 0
    assert out == "answer:what is linux"


def test_missing_key_prints_guidance(monkeypatch, capsys):
    monkeypatch.setattr(cli, "resolve_api_key", lambda: None)

    code = cli.main(["hello"])
    err = capsys.readouterr().err

    assert code == 1
    assert "bro config" in err


def test_interactive_exit(monkeypatch, capsys):
    monkeypatch.setattr(cli, "resolve_api_key", lambda: "abc")
    monkeypatch.setattr(cli, "GeminiClient", _FakeClient)

    inputs = iter(["quit"])
    monkeypatch.setattr("builtins.input", lambda _: next(inputs))

    code = cli.main([])
    out = capsys.readouterr().out

    assert code == 0
    assert "Interactive mode" in out
