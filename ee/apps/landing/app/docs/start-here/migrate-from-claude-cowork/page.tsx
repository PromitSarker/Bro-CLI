import type { Metadata } from "next";

import { MigrationGuidePage } from "../../../../components/migration-guide-page";
import { getGithubData } from "../../../../lib/github";
import { baseOpenGraph, withSocialMetadata } from "../../../../lib/seo";

export const metadata: Metadata = withSocialMetadata({
  title: "Migrate from Claude Cowork to Uni-CLI",
  description:
    "Move your files, skills, plugins, MCP servers, scheduled tasks, and team setup from Claude Cowork to Uni-CLI.",
  alternates: {
    canonical: "/docs/start-here/migrate-from-claude-cowork"
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Migrate from Claude Cowork to Uni-CLI",
    description:
      "A step-by-step guide to moving your Cowork setup to open-source Uni-CLI.",
    url: "https://uni-clilabs.com/docs/start-here/migrate-from-claude-cowork"
  }
});

export default async function MigrateFromClaudeCoworkPage() {
  const github = await getGithubData();

  return (
    <MigrationGuidePage
      stars={github.stars}
      downloadHref={github.downloads.macos}
    />
  );
}
