import { RoadmapPageShell } from "../../components/roadmap-page-shell";
import { getGithubData } from "../../lib/github";
import { baseOpenGraph, withSocialMetadata } from "../../lib/seo";

export const metadata = withSocialMetadata({
  title: "Uni-CLI Roadmap | A workspace for everyone, on any platform",
  description:
    "What is ready, being built, and coming soon for the Uni-CLI desktop app, Admin, MCP Gateway, Web, Automations, Workflows, Dashboards, and new apps.",
  alternates: {
    canonical: "/roadmap"
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Uni-CLI Roadmap | A workspace for everyone, on any platform",
    description:
      "What is ready, being built, and coming soon across every Uni-CLI product.",
    url: "https://uniClilabs.com/roadmap"
  }
});

export default async function RoadmapPage() {
  const github = await getGithubData();

  return <RoadmapPageShell stars={github.stars} />;
}
