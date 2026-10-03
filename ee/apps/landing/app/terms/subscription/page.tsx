import { LegalPage } from "../../../components/legal-page";
import { withSocialMetadata } from "../../../lib/seo";

export const metadata = withSocialMetadata({
  title: "Uni-CLI — Subscription Terms",
  description:
    "Subscription terms governing production use of Uni-CLI Enterprise Edition software by Different AI, doing business as Uni-CLI.",
  alternates: {
    canonical: "/terms/subscription"
  }
});

export default function SubscriptionTermsPage() {
  return <LegalPage file="terms/subscription/subscription-terms.md" />;
}
