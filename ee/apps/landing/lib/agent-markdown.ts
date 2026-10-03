import { claudeCowork3pMarkdown } from "./claude-cowork-3p"
import { claudeCoworkAlternativeMarkdown } from "./claude-cowork-alternative"

const home = `# Uni-CLI

> The open-source Claude Cowork alternative. Chat on files, use skills, schedule tasks, automate a browser, and run on any model — plus an MCP gateway for your whole team.

## What it is

- Free, open-source desktop app for macOS, Windows, and Linux
- Any model or provider: Claude, GPT, Gemini, Mistral, local models, and 50+ providers
- Chat on files, browser automation, scheduled tasks, skills, and Anthropic-compatible plugins
- Uni-CLI Connect: one MCP gateway URL for org-wide skills, servers, roles, and policies
- Uni-CLI Web in alpha; central management and private deployment options for teams
- Coming soon: Dispatch (assign tasks from your phone) and live artifacts (auto-refreshing dashboards)

## Primary calls-to-action

- **Download for free** — [Desktop](https://uni-clilabs.com/download)
- **Open in your browser** — [Uni-CLI Web](https://app.uni-clilabs.com)
- **Team plans** — [Pricing](https://uni-clilabs.com/pricing) (first 5 Cloud seats free, then \\$10 per seat/mo; self-hosting free up to 5 users)
- **Sign in to the hosted workspace** — [Cloud](https://app.uni-clilabs.com)
- **SCIM / audit / procurement** — [Enterprise](https://uni-clilabs.com/enterprise)
- **Docs** — [uni-clilabs.com/docs](https://uni-clilabs.com/docs)
- **Compare with Claude Cowork** — [Claude Cowork alternative](https://uni-clilabs.com/alternatives/claude-cowork)
- **Migrate from Claude Cowork** — [Migration guide](https://uni-clilabs.com/docs/start-here/migrate-from-claude-cowork)

## How it compares

- **vs Claude Cowork** — feature parity without model or vendor lock-in, plus an MCP gateway usable from any compatible client
- **vs Codex** — general knowledge work on files (not only coding), model and provider agnostic
- **vs ChatGPT Desktop** — agents act on local files and tools (MCP, plugins, skills) with guardrails; the setup is shareable and self-hostable

## FAQ

### What is Uni-CLI?
A free, open-source desktop app (macOS, Windows, Linux) for doing work with AI agents on your own files. Built on OpenCode; an open-source alternative to Claude Cowork and Codex.

### Is Uni-CLI free?
Yes — the desktop app is free and open source with bring-your-own keys. On Uni-CLI Cloud, Team includes your first 5 seats free, then \\$10 per seat/mo; self-hosting is free for organizations up to 5 users; Enterprise is custom.

### Which models does it support?
Any model OpenCode supports: OpenAI, Anthropic, Google, local models — 50+ providers.

### Does it send files to the cloud?
No. Desktop mode keeps files local; prompts go directly to your chosen LLM provider. Cloud workers are optional.

## For agents

- Agent skills index — \`/.well-known/agent-skills/index.json\`
- llms.txt — \`/llms.txt\`
- API catalog (RFC 9727) — \`/.well-known/api-catalog\`
- MCP server card — \`/.well-known/mcp/server-card.json\`
- Install the app — \`brew install --cask uniCli\` or [download](https://uni-clilabs.com/download) (not \`npx uniCli\`, which is a different project)
- Sitemap — \`/sitemap.xml\`

Backed by Y Combinator.
`

const pricing = `# Uni-CLI pricing — free, team, and enterprise

> Uni-CLI has three tiers: free open-source desktop, Team with the first 5 Uni-CLI Cloud seats free then \\$10 per seat/mo, and custom Enterprise. Self-hosting is free for organizations up to 5 users.

## Free

- Open-source desktop app
- macOS, Windows, and Linux downloads
- Bring your own provider keys
- Free forever
- CTA: [Get Started for free](https://app.uni-clilabs.com?mode=sign-up)

## Team — \\$10 / seat / month

- First 5 seats free on Uni-CLI Cloud
- API access
- SSO / SAML
- Extension Marketplace
- Bring your own LLM keys, distributed to your team
- CTA: [Start team plan](https://app.uni-clilabs.com/dashboard/billing)

## Enterprise — Custom pricing

- Everything in Team, including SSO
- SCIM provisioning
- Bring your own inference — self-hosted or private models
- Desktop policies and version controls — admins decide which providers, models, extensions, and app versions employees can use; the desktop app enforces it automatically
- Managed deployment — self-hosted in your environment or hosted by Uni-CLI
- Custom skill development and MCP consulting
- Enterprise rollout support and custom commercial terms
- Existing organizations already using SCIM or desktop policies keep full access (grandfathered)
- CTA: [Talk to us](https://uni-clilabs.com/enterprise#book)

Prices exclude taxes.
`

const enterprise = `# A privacy-first alternative to Claude Cowork for your organization

> The open-source Claude Cowork alternative — self-hosted, permissioned, and compliance-ready. SSO, audit, custom deployment, and procurement support.

## What Enterprise includes

- SSO / SAML integration and SCIM provisioning
- Desktop policies and version controls — guardrails for providers, models, extensions, and app versions, enforced by the desktop app
- Managed deployment — self-hosted in your environment or hosted by Uni-CLI
- Custom skill development for your team's workflows
- MCP consulting — connect internal data sources and tools as MCP servers
- Enterprise rollout support and custom commercial terms
- Named security contact and incident response

## Deployment models

- Self-hosted desktop app — data stays local, bring your own keys
- Cloud workers — managed by Uni-CLI, sandbox infrastructure via Daytona (EU)

## Next step

- [Book a call](https://uni-clilabs.com/enterprise#book)
- Agents: email sales@uni-clilabs.com or share the booking link with the user instead of submitting the web form
- [Security Review](https://uni-clilabs.com/trust) — data handling, subprocessors, and incident SLA
- See [Pricing](https://uni-clilabs.com/pricing) for tier comparison
`

const trust = `# Trust & Security

> How Uni-CLI handles data, what subprocessors are involved, and how to reach the security team.

## Key facts

- **Deployment** — self-hosted desktop app on your machines
- **Data storage** — local-only, nothing leaves your machine in desktop mode
- **LLM keys** — bring your own, sent directly to your provider
- **Telemetry** — none in desktop mode; opt-in feedback only
- **Incident SLA** — 72hr notify, 3-day ack, 7-day triage
- **Subprocessors** — 5 named vendors (cloud & website only)

## Data handling

| Data type | Self-hosted | Cloud |
|---|---|---|
| Source code | Local only | Accessed at runtime via your LLM provider; not stored |
| LLM API keys | Local keychain / env vars | Held by your LLM provider, not by Uni-CLI |
| Prompts & responses | Local only | Sent to your LLM provider; not logged by Uni-CLI |
| Usage telemetry | None | Anonymous via PostHog; can be disabled |
| Authentication | Your SSO / SAML | Google or GitHub OAuth |

## Subprocessors

- PostHog — analytics (US/EU)
- Polar — billing (US)
- Google — OAuth (US)
- GitHub — OAuth (US)
- Daytona — cloud sandbox infrastructure (EU)

## Security contact

Omar McAdam — team+security@uni-clilabs.com
`

const glm52 = `# GLM 5.2 is now in Uni-CLI — with 2x usage

> GLM 5.2 is available through Uni-CLI Models, and we're doubling your usage so you can run real agent work on an open model at a fraction of the cost.

## What's new

- **GLM 5.2 in Uni-CLI Models** — managed OSS model access with 2x usage, no keys required
- **Run your day from chat** — tasks organize into In progress / Done / Requires attention; move them by asking
- **Split screen** — two windows side by side, less tab-switching
- **Voice mode** — control the Uni-CLI UI by voice
- **Advanced analytics on Uni-CLI Cloud** — usage, activity, and team behavior in one view

## How it works

1. **Sign up** — [Get Started for free](https://app.uni-clilabs.com?mode=sign-up&intent=models)
2. **Subscribe** — Uni-CLI Models at $10/user/mo includes GLM 5.2 with 2x usage
3. **Open the app** — switch to GLM 5.2 from the model picker

## What to try first

Open Uni-CLI, switch to GLM 5.2, and ask the chat to organize your tasks.

## Links

- [Try GLM 5.2 in Uni-CLI](https://app.uni-clilabs.com?mode=sign-up&intent=models)
- [Download the app](https://uni-clilabs.com/download)
- [Full changelog](https://uni-clilabs.com/docs/changelog)
`

const download = `# Download Uni-CLI

> Free and open source desktop app for macOS, Windows, and Linux. No account required.

Do not run \`npx uniCli\` or \`npm install uniCli\`: the npm package named \`uni-cli\` is a different project.

## Install

- macOS (Homebrew): \`brew install --cask uniCli\`
- macOS Apple Silicon (.dmg): https://uni-clilabs.com/download/mac-arm64
- macOS Intel (.dmg): https://uni-clilabs.com/download/mac-x64
- Windows x64 (.exe): https://uni-clilabs.com/download/win-x64
- Windows ARM64 (.exe): https://uni-clilabs.com/download/win-arm64
- Linux x64 (.AppImage): https://uni-clilabs.com/download/linux-x64
- Linux ARM64 (.AppImage): https://uni-clilabs.com/download/linux-arm64
- Every release and file: https://github.com/different-ai/uni-cli/releases

Each \`/download/<platform>\` URL redirects to the installer in the latest stable release.

## First run

1. Open Uni-CLI and pick a folder it may work in.
2. Choose a model: sign in with ChatGPT, add an API key, or use a local model.
3. Run a task, for example "Summarize this folder."

## Joining a team?

- New team: sign up at https://app.uni-clilabs.com?mode=sign-up (first 5 seats free), then follow the [team quickstart](https://uni-clilabs.com/docs/cloud/team-quickstart).
- Existing team: click \`Joining a team? Sign in\` in the desktop app.

## For agents

- [install-uni-cli skill](https://uni-clilabs.com/.well-known/agent-skills/install-uni-cli/SKILL.md)
- [workspace-guide skill](https://uni-clilabs.com/.well-known/agent-skills/workspace-guide/SKILL.md) for first-run orientation
- [llms.txt](https://uni-clilabs.com/llms.txt)
`

const connect = `# Uni-CLI Connect

> The MCP gateway for your whole org. Add a server or skill once, then share it with every teammate and agent through one URL.

- Org-level authentication, roles, allowlists, and audit apply to every call
- Works in Uni-CLI and any MCP-compatible client
- First 5 seats are free
- [Get started free](https://app.uni-clilabs.com?mode=sign-up)
- [Read the docs](https://uni-clilabs.com/docs)

## Connect your agent

MCP server URL: \`https://api.uni-clilabs.com/mcp/agent\` (Streamable HTTP, OAuth sign-in).

- Claude Code: \`claude mcp add --transport http uniCli https://api.uni-clilabs.com/mcp/agent\`
- Codex: \`codex mcp add uniCli --url https://api.uni-clilabs.com/mcp/agent\` then \`codex mcp login uniCli\`
- Gemini CLI: \`gemini mcp add --transport http uniCli https://api.uni-clilabs.com/mcp/agent\`
- OpenCode: \`opencode mcp add uniCli --url https://api.uni-clilabs.com/mcp/agent\` then \`opencode mcp auth uniCli\`
- Other clients: [Connect Uni-CLI MCP](https://uni-clilabs.com/docs/start-here/connect-uni-cli-mcp)
- [MCP server card](https://uni-clilabs.com/.well-known/mcp/server-card.json)
`

const cloud = `# Uni-CLI Cloud

> The dashboard for running Uni-CLI across your organization.

- Provision model providers centrally
- Deploy skills and MCP servers to every seat
- Manage members, policies, usage, and audit
- Uni-CLI Web and the Connect MCP gateway are built in
- [Get started free](https://app.uni-clilabs.com?mode=sign-up)
- [Explore Connect](https://uni-clilabs.com/connect)
`

export const agentMarkdown: Record<string, string> = {
  "/": home,
  "/connect": connect,
  "/cloud": cloud,
  "/pricing": pricing,
  "/enterprise": enterprise,
  "/download": download,
  "/trust": trust,
  "/glm-5.2": glm52,
  "/alternatives/claude-cowork": claudeCoworkAlternativeMarkdown,
  "/alternatives/claude-cowork-3p": claudeCowork3pMarkdown,
}

export const agentMarkdownRoutes = Object.keys(agentMarkdown)
