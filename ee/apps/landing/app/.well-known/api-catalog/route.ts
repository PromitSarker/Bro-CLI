export const dynamic = "force-static"

const linkset = {
  linkset: [
    {
      anchor: "https://api.uni-clilabs.com",
      "service-desc": [
        {
          href: "https://api.uni-clilabs.com/openapi.json",
          type: "application/vnd.oai.openapi+json;version=3.1",
          title: "Uni-CLI Den API — OpenAPI 3.1 document",
        },
      ],
      "service-doc": [
        {
          href: "https://uni-clilabs.com/docs/api-reference",
          type: "text/html",
          title: "Uni-CLI Den API — human documentation",
        },
      ],
      status: [
        {
          href: "https://api.uni-clilabs.com/health",
          type: "application/json",
          title: "Uni-CLI Den API — health endpoint",
        },
      ],
      "service-meta": [
        {
          href: "https://uni-clilabs.com/llms.txt",
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
