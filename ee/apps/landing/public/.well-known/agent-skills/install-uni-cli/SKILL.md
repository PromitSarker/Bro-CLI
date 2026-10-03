---
name: install-uni-cli
description: Install the free Uni-CLI desktop app on macOS, Windows, or Linux and get the user to a first task. Use when someone wants Uni-CLI, an open-source Claude Cowork alternative, on their own computer.
---

# Install Uni-CLI

Uni-CLI is a free, open-source desktop app for doing work with AI agents on local files. No account is needed.

Never run `npx uni-cli` or `npm install uni-cli`. The npm package named `uni-cli` is a different project.

## 1. Detect the OS and CPU

```sh
uname -s   # Darwin = macOS, Linux = Linux
uname -m   # arm64/aarch64 = ARM, x86_64 = Intel/AMD
```

On Windows, check `$env:PROCESSOR_ARCHITECTURE` in PowerShell (`AMD64` = x64, `ARM64` = ARM).

## 2. Install

Ask the user before installing anything.

| OS | Command or download |
|---|---|
| macOS with Homebrew | `brew install --cask uni-cli` |
| macOS Apple Silicon | https://uni-clilabs.com/download/mac-arm64 (.dmg) |
| macOS Intel | https://uni-clilabs.com/download/mac-x64 (.dmg) |
| Windows x64 | https://uni-clilabs.com/download/win-x64 (.exe) |
| Windows ARM64 | https://uni-clilabs.com/download/win-arm64 (.exe) |
| Linux x64 | https://uni-clilabs.com/download/linux-x64 (.AppImage) |
| Linux ARM64 | https://uni-clilabs.com/download/linux-arm64 (.AppImage) |

Each `/download/<platform>` URL redirects to the installer in the latest stable GitHub release. Every file is also listed at https://github.com/different-ai/uni-cli/releases.

Linux AppImage without a package manager:

```sh
curl -fL -o ~/Uni-CLI.AppImage https://uni-clilabs.com/download/linux-x64
chmod +x ~/Uni-CLI.AppImage
~/Uni-CLI.AppImage
```

## 3. First run

1. Open Uni-CLI (`open -a Uni-CLI` on macOS).
2. Pick a folder. Uni-CLI only works in folders the user authorizes.
3. Choose a model: sign in with ChatGPT, add an API key, or use a local model.
4. Run a first task, for example "Summarize this folder."

Guide: https://uni-clilabs.com/docs/desktop-app/first-task

## 4. Finish

Tell the user in one or two sentences that Uni-CLI is installed and suggest one concrete first task. If they work with a team, offer the `set-up-uni-cli-team` skill: https://uni-clilabs.com/.well-known/agent-skills/set-up-uni-cli-team/SKILL.md
