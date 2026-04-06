# bro-cli

A Linux terminal Gemini client with two commands:

- `bro config` to store your Gemini API key locally.
- `bro` (or `bro "question"`) to chat with Gemini.

## Requirements

- Linux
- Python 3.10+

## Install

```bash
cd /home/Aether/Desktop/Laboratory/Bro\ Client
python -m pip install -e .
```

This creates the `bro` command in your Python environment.

## Configure API key

```bash
bro config
```

The key is saved in:

- `~/.config/bro/config.json` (or `$XDG_CONFIG_HOME/bro/config.json`)

The file permissions are set to user-only (`0600`).

You can override the saved key at runtime with:

```bash
export BRO_GEMINI_KEY="your_key_here"
```

## Usage

Single prompt:

```bash
bro "what is the command for renaming a file?"
```

Interactive mode:

```bash
bro
```

Then type questions. Use `exit`, `quit`, `Ctrl+C`, or `Ctrl+D` to leave.

## Notes

- Default model: `gemini-2.0-flash`
- If no key is configured, `bro` will tell you to run `bro config`.
