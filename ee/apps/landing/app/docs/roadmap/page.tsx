import { RoadmapPageShell } from "../../../components/roadmap-page-shell";
import { getGithubData } from "../../../lib/github";
import { baseOpenGraph, withSocialMetadata } from "../../../lib/seo";

export const metadata = withSocialMetadata({
  title: "Uni-CLI Roadmap",
  description:
    "What Uni-CLI supports today and what is coming next across desktop, hosted workspaces, external agents, and new surfaces.",
  alternates: {
    canonical: "/roadmap"
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Uni-CLI Roadmap | A workspace for everyone, on any platform",
    description:
      "What is ready, being built, and coming soon across every Uni-CLI product.",
    url: "https://uni-clilabs.com/roadmap"
  }
});

export default async function DocsRoadmapPage() {
  const github = await getGithubData();

  return <RoadmapPageShell stars={github.stars} />;
}
