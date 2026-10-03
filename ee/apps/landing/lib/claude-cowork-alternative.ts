import type { CompareCard } from "./compare";
import { capabilityMarkdown } from "./cowork-capabilities";
import type { FaqEntry } from "./faq";

export const CLAUDE_COWORK_ALTERNATIVE_PATH = "/alternatives/claude-cowork";
export const CLAUDE_COWORK_ALTERNATIVE_URL = `https://uni-clilabs.com${CLAUDE_COWORK_ALTERNATIVE_PATH}`;
export const MIGRATION_GUIDE_PATH = "/docs/start-here/migrate-from-claude-cowork";

export const claudeCoworkAlternativeHeading = "The free, open-source alternative to Claude Cowork";

/** Hero sub-line. Keep it under 20 words. */
export const claudeCoworkAlternativeAnswer =
  "Any model, your own keys, files that stay on your machine. Free for macOS, Windows, and Linux.";

export const alternativeCards: CompareCard[] = [
  {
    icon: "cpu",
    title: "Run local models with Ollama or LM Studio",
    link: { label: "Add a local model", href: "/docs/start-here/connect-your-stack/add-a-custom-llm" }
  },
  {
    icon: "key",
    title: "Bring your own key or AI gateway",
    link: { label: "Connect a provider", href: "/docs/cloud/share-with-your-team/custom-llm-provider" }
  },
  {
    icon: "monitor",
    title: "One app for macOS, Windows, and Linux",
    link: { label: "Download", href: "/download" }
  },
  {
    icon: "users",
    title: "Share skills and MCP servers with everyone",
    link: { label: "Desktop policies", href: "/docs/cloud/share-with-your-team/desktop-policies" }
  }
];

export const claudeCoworkAlternativeFaq: FaqEntry[] = [
  {
    question: "Is there a free alternative to Claude Cowork?",
    answer: "Yes. Uni-CLI is a free, open-source desktop app for macOS, Windows, and Linux."
  },
  {
    question: "Does Uni-CLI work with local models?",
    answer: "Yes. Use Ollama, LM Studio, or any OpenAI-compatible server, and nothing leaves your computer."
  },
  {
    question: "Can I use my own API key or AI gateway?",
    answer: "Yes. Connect keys from 50+ providers, or add your company's OpenAI-compatible gateway as a custom provider."
  },
  {
    question: "Can I still use Claude models?",
    answer: "Yes. Add an Anthropic key and switch to any other model at any time."
  },
  {
    question: "Do my files stay on my computer?",
    answer: "Yes. In desktop mode files stay local and prompts go straight to the provider you pick."
  },
  {
    question: "How do I migrate from Claude Cowork?",
    answer:
      "Open the same folder in Uni-CLI and connect a model; SKILL.md skills, plugins, and MCP servers use the same formats. The migration guide covers each step."
  }
];

export const claudeCoworkAlternativeMarkdown = `# ${claudeCoworkAlternativeHeading}

> ${claudeCoworkAlternativeAnswer}

## Uni-CLI vs Claude Cowork

${capabilityMarkdown()}

## Why people switch

${alternativeCards.map((card) => `- ${card.title}: [${card.link.label}](https://uni-clilabs.com${card.link.href})`).join("\n")}

## Cost

The page includes a calculator comparing Claude Team, Claude Enterprise, and Uni-CLI plans for your team size, usage, and models, using list API prices from models.dev. On Bedrock, Vertex, or Foundry? Compare features in [Uni-CLI vs Claude Cowork on 3P](https://uni-clilabs.com/alternatives/claude-cowork-3p).

## FAQ

${claudeCoworkAlternativeFaq.map((entry) => `### ${entry.question}\n${entry.answer}`).join("\n\n")}

## Next steps

- [Download Uni-CLI for free](https://uni-clilabs.com/download)
- [Migration guide](https://uni-clilabs.com${MIGRATION_GUIDE_PATH})
`;
