export const dynamic = "force-static"

const linkset = {
  linkset: [
    {
      anchor: "https://api.uniClilabs.com",
      "service-desc": [
        {
          href: "https://api.uniClilabs.com/openapi.json",
          type: "application/vnd.oai.openapi+json;version=3.1",
          title: "Uni-CLI Den API — OpenAPI 3.1 document",
        },
      ],
      "service-doc": [
        {
          href: "https://uniClilabs.com/docs/api-reference",
          type: "text/html",
          title: "Uni-CLI Den API — human documentation",
        },
      ],
      status: [
        {
          href: "https://api.uniClilabs.com/health",
          type: "application/json",
          title: "Uni-CLI Den API — health endpoint",
        },
      ],
      "service-meta": [
        {
          href: "https://uniClilabs.com/llms.txt",
          type: "text/plain",
          title: "Uni-CLI llms.txt — agent-facing site guide",
        },
      ],
    },
  ],
}

export function GET() {
  return new Response(JSON.stringify(linkset, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
