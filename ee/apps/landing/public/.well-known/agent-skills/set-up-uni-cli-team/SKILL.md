---
name: set-up-uni-cli-team
description: Set up Uni-CLI for a team - sign up for Uni-CLI Cloud, create the organization, invite teammates, share models through the AI Gateway, and share a skill. Use when a team or company wants Uni-CLI with shared skills, models, or policies.
---

# Set up Uni-CLI for a team

Uni-CLI Cloud is the team control plane: members, shared models (AI Gateway), shared skills and plugins, and the MCP Gateway. The first 5 seats are free; then $10 per seat per month. Pricing: https://uni-clilabs.com/pricing

The human creates the account. Don't invent passwords or create accounts for the user without asking.

## Recommended: dashboard (about 15 minutes)

1. **Sign up:** https://app.uni-clilabs.com?mode=sign-up. Right after sign-up, the user names their team; that creates the organization. No credit card.
2. **Invite teammates:** `Members` > `Add member`, enter an email, pick a role (usually Member), `Send invite`. Group people under `Teams` > `Create Team`.
3. **Share models:** `AI Gateway` > `AI Providers` > `Add provider`, pick a provider, paste the org key, and choose who can use it. Members never handle keys.
4. **Share a skill:** create a Collection (`Collections` > `New collection`), then `Plugin Directory` > `Create plugin` > `+ Skill`. Write a name, a "use when..." description, and markdown instructions. Share it to the Collection and grant the Collection to a team.
5. **Everyone installs the desktop app** (skill: https://uni-clilabs.com/.well-known/agent-skills/install-uni-cli/SKILL.md) and clicks `Joining a team? Sign in`. Shared skills appear under `Settings` > `Library`.

Walkthrough with screenshots: https://uni-clilabs.com/docs/cloud/team-quickstart

## Headless: let the agent set it up

When the user wants the agent to do the setup from a terminal, follow https://uni-clilabs.com/start.md. It installs the `uni-cli-bootstrap` CLI (needs Node.js 20+; it is not on npm) and creates a provisional workspace with a first skill. The human claims ownership later in the browser, so no password is created by the agent.

```sh
curl -fsSLo /tmp/uni-cli-install.sh https://uni-clilabs.com/install.sh
less /tmp/uni-cli-install.sh   # inspect before running
sh /tmp/uni-cli-install.sh
uni-cli-bootstrap doctor --json
```

Then run `uni-cli-bootstrap cloud bootstrap-workspace` exactly as start.md describes. Teammate emails passed with `--teammate-emails` are invited once a human claims the workspace.

To keep building in that workspace before anyone claims it (adding skills and connections through the MCP gateway), or to sign the CLI in as an existing user without a password, follow https://uni-clilabs.com/auth.md.

## Then: bring Uni-CLI into the team's agents

Each member can connect their coding agent to the organization with the `connect-uni-cli-mcp` skill: https://uni-clilabs.com/.well-known/agent-skills/connect-uni-cli-mcp/SKILL.md

## Needs SSO, SCIM, audit, or self-hosting?

Send the user to https://uni-clilabs.com/enterprise.
