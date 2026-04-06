# Bro CLI

A lightweight, fast, and secure Linux terminal client for Google's Gemini AI. 

`bro` allows you to interact with Gemini directly from your command line, offering both single-prompt execution and a persistent interactive chat mode. It securely manages your API credentials using standard Linux XDG directories.

## Features

- **Interactive & Single-Prompt Modes:** Seamlessly switch between quick one-off questions and interactive conversational sessions.
- **Secure Credential Management:** API keys are stored securely in `~/.config/bro/config.json` with strict user-only (`0600`) file permissions.
- **Environment Variable Support:** Override stored configurations on the fly using the `BRO_GEMINI_KEY` environment variable.
- **Terminal-Optimized Output:** Instructs Gemini to return direct, concise answers without unnecessary markdown formatting or conversational filler.

## Requirements

- Linux
- Python 3.10 or higher
- [pipx](https://pipx.pypa.io/) (Required for isolated global CLI installation)

## Installation

Install `bro-cli` globally as an isolated application using `pipx`. 

To install directly from your Git repository:

```bash
pipx install git+https://github.com/PromitSarker/Bro-CLI.git
```

**Local Installation:**
If you have cloned the repository to your local machine, you can navigate to the project folder and install it by running:
```bash
pipx install .
```

**Updating:**
To upgrade to the latest version in the future:
```bash
pipx upgrade bro-cli
```

## Configuration

Before using the client, you must configure your Google Gemini API key. Run the following command:

```bash
bro config
```

You will be prompted to paste your API key. It will be saved securely to your system.

## Usage

### Single Prompt

Ask a direct question. The client will return the answer to your standard output and exit:

```bash
bro "Why life so hard ?"
```

*Note: You can also skip the quotes for simple queries:*
```bash
bro how to go and breathe
```

### Interactive Mode

Start a multi-turn chat session by running the command without any arguments:

```bash
bro
```

*Inside the interactive prompt, type `exit`, `quit`, or press `Ctrl+C`/`Ctrl+D` to end the session.*

## Technical Details

- **Default Model:** `gemini-2.5-flash-lite`
- **SDK:** Powered by the official `google-genai` Python SDK.
