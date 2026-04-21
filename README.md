# 🕶️ Bro-CLI: The Agentic Terminal Bro

**Bro-CLI** is an advanced, stateful, and context-aware **agentic terminal assistant**. Moving beyond simple LLM wrappers, Bro-CLI represents a locally-hosted, step-by-step orchestrator that can actively reason, propose, and execute shell commands within your Linux environment.

Whether you're scaffolding projects, debugging esoteric stack traces, or automating server administration, Bro acts as an autonomous pair-programmer that learns alongside you.

---

## 🛠️ Technical Stack

Bro-CLI is engineered with a focus on modularity, security, and response speed.

- **Language**: Python 3.10+
- **Agentic Engine**: Custom-built deterministic orchestration (Manager, Planner, Worker, Reflection)
- **Generative AI Providers**:
  - **Google GenAI** (Gemini 2.5 / 3.0 Flash) - High-throughput reasoning.
  - **Groq Cloud** (Llama 3.3) - Ultra-low latency, open-weight execution.
- **Persistent Memory**: **SQLite3** (Local RAG / Knowledge Base mapping past executions).
- **Terminal UI / Rendering**: [Rich](https://github.com/Textualize/rich) - For highly readable, stylized cyberpunk-themed output, panels, and prompts.
- **Process Execution**: `subprocess` with real-time Context Window Management (ANSI-stripping to preserve LLM token limits).

---

## 🧠 Architecture & Workflow

Bro uses a **DAG-inspired execution loop** for complex tasks. It evaluates user intent, forms a plan, executes, and critically—reflects on the outcome.

### 1. **Knowledge Retrieval (`memory.py`)** 
Before planning, Bro queries a local SQLite database for past "episodes". If you previously asked it to solve a specific bug, it will fetch the reflection of that attempt and inject it into the prompt context to prevent repeating mistakes.

### 2. **Hierarchical Planning (`planner.py`)** 
Complex prompts (e.g., "Find my python files and lint them") are sent to the Planner. The Planner decomposes the task into atomic, sequential sub-steps to prevent the LLM from hallucinating entirely invalid pipelines. 

*Fast Pathing:* Short conversational prompts bypass this layer entirely for zero-latency interactions.

### 3. **The Worker Shell (`worker.py` & `utils/shell.py`)** 
The core execution loop. The worker determines the required Unix command for the current sub-step.
- **Safety First:** Commands are intercepted by a confirmation UI (`Confirm.ask`). The user retains absolute control.
- **Smart Telemetry Management:** Commands that notoriously bloat standard error (like `find` without root) are dynamically appended with `2>/dev/null`.
- **Token Hygiene:** Bash output is stripped of ANSI escape sequences and truncated to <1500 characters, returning only the essential signal to the LLM. CWD (Current Working Directory) shifts are dynamically tracked.

### 4. **Reflection engine (`reflection.py`)** 
Upon task completion, the Reflection engine analyzes the executed command history versus the intended goal. If it learned a useful trick or encountered an error it successfully mitigated, it synthesizes a summary and stores it in the local SQLite Knowledge Base (`episodes` table).

---

## 📂 Codebase Blueprint

```text
bro_cli/
├── main.py            # CLI entry point, argument parsing, & command routing
├── config.py          # Secure local configuration & API key management
├── engine/            # 🧠 The Brains
│   ├── manager.py     # Main task orchestrator combining all engine subsystems
│   ├── planner.py     # Hierarchical step decomposition & prompt evaluation
│   ├── worker.py      # Execution loop and shell-command generation
│   ├── reflection.py  # Post-task analysis & synthetic learning
│   └── memory.py      # Local SQLite Knowledge Base controller
├── providers/         # 🤖 AI Backends Interface
│   ├── base.py        # Abstract factory interface for LLM clients
│   ├── gemini.py      # Google GenAI implementation
│   └── groq.py        # Groq Cloud implementation
├── ui/                # 🎨 Terminal Aesthetics
│   └── terminal.py    # Custom Rich themes, success/error styling, and panels
└── utils/             # 🔧 System Utilities
    └── shell.py       # Safe subprocess execution, CWD state tracking, output sanitation
```

---

## ⚡ Quick Start

### 1. Installation
Install globally as an editable Python package:
```bash
pip install -e .
```

### 2. Configuration
Initialize the configuration. API keys are saved locally with strict **0600** file permissions.
```bash
bro config
```

### 3. Usage & Modes

**Direct Execution (One-Shot):**
```bash
bro "Find my Laboratory folder and check the python files"
```

**Interactive REPL Mode:**
```bash
bro
```

**Provider Switching:**
Easily target specific hardware or models by overriding the default provider:
```bash
bro -p groq "Analyze this stack trace"
bro -p gemini "Refactor this module"
```

---

## 🛡️ Privacy & Security Commitments

- **Air-Gapped Telemetry**: Terminal payloads only transit to the LLM provider you explicitly authenticate with. No tracking, no middle-men.
- **Absolute Execution Control**: The agentic loop intrinsically requires manual approval via `[y/n]` prompts prior to system state changes. 
- **Secret Management**: Configuration data resides in restricted local storage (`~/.config/bro/config.json`) inaccessible to other system users.

---

## 📜 License
MIT License.  
*Hack the planet. Stay agentic.* 🛡️
