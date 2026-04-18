# 🕶️ Bro-CLI: The Agentic Terminal Bro

**Bro-CLI** isn't just another LLM wrapper—it's an **agentic terminal assistant** that actually *does* things. Built for developers who want a smart buddy in their Linux environment to help find files, initialize repos, fix bugs, and automate the mundane.

---

## 🔥 Key Features

- **🧠 Agentic & Stateful**: Doesn't just talk; it proposes and executes terminal commands.
- **💾 Local Memory**: Remembers past successes and lessons in a local SQLite database.
- **🔒 Security First**: Masked API key entry and automatic suppression of permission-denied noise.
- **🚀 Multi-Provider**: Switch between **Google Gemini (Flash 2.5/3.0)** and **Groq Cloud (Llama 3.3)** on the fly.
- **📂 Clean Architecture**: Modular, professionally structured codebase that's easy to hack on.

---

## 🛠️ Project Structure

For developers looking to contribute or customize, here is the "Bro" blueprint:

```text
bro_cli/
├── main.py            # Clean CLI entry point & command routing
├── config.py          # Secure local configuration management
├── engine/            # 🧠 The Brains
│   ├── manager.py     # Task orchestrator
│   ├── planner.py     # Hierarchical step decomposition
│   ├── worker.py      # Command execution loop
│   ├── reflection.py  # Post-task analysis & learning
│   └── memory.py      # Local SQLite Knowledge Base
├── providers/         # 🤖 AI Backends
│   ├── base.py        # Standardized client interface
│   ├── gemini.py      # Google GenAI implementation
│   └── groq.py        # Groq Cloud implementation
├── ui/                # 🎨 Aesthetics
│   └── terminal.py    # Custom cyberpunk theme & Rich panels
└── utils/             # 🔧 Toolbox
    └── shell.py       # Safe subprocess execution & CWD tracking
```

---

## ⚡ Quick Start

### 1. Installation
```bash
pip install -e .
```

### 2. Configuration
```bash
bro config
```
*Choose your favorite provider and securely paste your API keys.*

### 3. Usage
```bash
# Direct task execution
bro "Find my Laboratory folder and check for any .py files"

# Interactive mode
bro

# Use a specific provider
bro -p groq "Explain the current directory structure"
```

---

## 🛡️ Privacy & Security

- **No Remote Telemetry**: Your commands and data never leave your machine except for the specific truncated context sent to your chosen AI provider.
- **Full Control**: Every command is proposed with a `[y/n]` confirmation. You are always the boss.
- **Secure Storage**: API keys are stored in a `json` file with restricted `0600` permissions.

---

## 📜 License
MIT - Feel free to fork, hack, and make it your own. Stay agentic! 🛡️
