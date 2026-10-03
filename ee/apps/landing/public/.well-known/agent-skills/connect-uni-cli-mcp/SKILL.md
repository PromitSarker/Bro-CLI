---
name: connect-uni-cli-mcp
description: Connect the Uni-CLI MCP Gateway (https://api.uniClilabs.com/mcp/agent) to Claude Code, Codex, Gemini CLI, Cursor, VS Code, Claude Desktop, or ChatGPT so the agent can use the user's Uni-CLI organization skills, plugins, and connections.
---

# Connect the Uni-CLI MCP Gateway

Server URL: `https://api.uniClilabs.com/mcp/agent`
Transport: Streamable HTTP. Auth: OAuth (PKCE, dynamic client registration); the client opens a browser for sign-in. No API key is needed.

The user needs an Uni-CLI Cloud account. If they don't have one, send them to https://app.uniClilabs.com?mode=sign-up first.

## 1. Add the server

Use the command for the client you are running in. If an `uni-cli` entry already exists, don't add a duplicate; sign in with the existing one.

Claude Code:

```sh
claude mcp add --transport http uni-cli https://api.uniClilabs.com/mcp/agent
# add `-s user` to make it available in every project
```

Codex:

```sh
codex mcp add uni-cli --url https://api.uniClilabs.com/mcp/agent
codex mcp login uni-cli
```

Gemini CLI:

```sh
gemini mcp add --transport http uni-cli https://api.uniClilabs.com/mcp/agent
```

OpenCode:

```sh
opencode mcp add uni-cli --url https://api.uniClilabs.com/mcp/agent
opencode mcp auth uni-cli
```

Cursor, VS Code, Claude Desktop, ChatGPT, Windsurf, Zed: add `https://api.uniClilabs.com/mcp/agent` as a remote MCP server. Per-client steps: https://uniClilabs.com/docs/start-here/connect-uni-cli-mcp

## 2. Sign in

- Claude Code: run `/mcp`, select `uni-cli`, and authenticate.
- Codex: `codex mcp login uni-cli` opens the browser.
- Gemini CLI: run `/mcp auth uni-cli`.
- OpenCode: `opencode mcp auth uni-cli` opens the browser.

The user signs in and picks their organization. The organization is pinned to the token; to switch, log out of the `uni-cli` server and sign in again.

## 3. Verify

1. `claude mcp list` (or the client's equivalent) shows `uni-cli`.
2. Restart the agent session so the new tools load.
3. The agent has the `search_capabilities` and `execute_capability` tools.
4. Ask: "Which Uni-CLI organization am I connected to?"

Don't claim the connection works until step 3 passes.

## If it fails

- 401 or `invalid_grant`: log out of `uni-cli` in the client and sign in again.
- No person can sign in yet (headless agent): see https://uniClilabs.com/auth.md for anonymous workspaces a person claims later.
- Self-hosted Uni-CLI: use your own Den API origin, for example `https://api.<your-den-web-host>/mcp/agent`.
- Reference: https://uniClilabs.com/docs/cloud/run-in-the-cloud/cloud-mcp
