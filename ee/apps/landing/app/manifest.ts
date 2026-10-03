import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Uni-CLI",
    short_name: "Uni-CLI",
    description:
      "Open source Claude Cowork alternative. Bring your own model, wire in your tools, and ship reusable agent setups across your org.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#011627",
    icons: [
      {
        src: "/icon.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any"
      },
      {
        src: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
        purpose: "any"
      },
      {
        src: "/uni-cli-mark.svg",
        type: "image/svg+xml",
        sizes: "any"
      }
    ]
  };
}
