import { LandingTrustOverview } from "../../components/landing-trust";
import { getGithubData } from "../../lib/github";
import { baseOpenGraph, withSocialMetadata } from "../../lib/seo";

export const metadata = withSocialMetadata({
  title: "Uni-CLI — Security & Data Privacy",
  description:
    "How Uni-CLI handles data, subprocessors, incident response, and compliance for self-hosted enterprise deployments.",
  alternates: {
    canonical: "/trust"
  },
  openGraph: {
    ...baseOpenGraph,
    url: "https://uniClilabs.com/trust"
  }
});

export default async function TrustPage() {
  const github = await getGithubData();
  const cal = process.env.NEXT_PUBLIC_CAL_URL ?? "";

  return (
    <LandingTrustOverview
      stars={github.stars}
      calUrl={cal}
    />
  );
}
