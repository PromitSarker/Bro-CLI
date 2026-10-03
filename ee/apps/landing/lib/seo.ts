import type { Metadata } from "next";

const socialImage = {
  url: "/uni-cli-social.png",
  width: 1200,
  height: 630,
  alt: "Uni-CLI — Your AI workspace. Without vendor lock-in."
};

export const baseOpenGraph = {
  type: "website",
  siteName: "Uni-CLI",
  locale: "en_US",
  images: [socialImage]
} satisfies Metadata["openGraph"];

export const baseTwitter = {
  card: "summary_large_image",
  images: [socialImage]
} satisfies Metadata["twitter"];

export function withSocialMetadata(metadata: Metadata): Metadata {
  const title = metadata.openGraph?.title ?? metadata.title ?? undefined;
  const description = metadata.openGraph?.description ?? metadata.description ?? undefined;

  return {
    ...metadata,
    openGraph: {
      ...baseOpenGraph,
      ...metadata.openGraph,
      title,
      description,
      images: baseOpenGraph.images
    },
    twitter: {
      ...metadata.twitter,
      ...baseTwitter,
      title: metadata.twitter?.title ?? title,
      description: metadata.twitter?.description ?? description
    }
  };
}
