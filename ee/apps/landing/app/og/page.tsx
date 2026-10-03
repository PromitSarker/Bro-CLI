import OGImage from "../../components/og-image";
import { withSocialMetadata } from "../../lib/seo";

export const metadata = withSocialMetadata({
  openGraph: {
    title: "Uni-CLI — Social image preview",
    description: "Preview the Uni-CLI social sharing image."
  }
});

export default function OGPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f9fc] p-6">
      <OGImage />
    </main>
  );
}
