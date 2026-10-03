# Uni-CLI Model Catalog

This directory is the static publish root for the generated Uni-CLI model catalog.

Cloudflare Pages can deploy this directory directly:

- Build command: `pnpm --dir ee/apps/gateway models:build`
- Build output directory: `ee/apps/gateway/models-site`
- Catalog URL: `/models/api.json`

The generated `models/api.json` file is ignored by git. It is rebuilt from `src/models/base.json` and the active Uni-CLI overlay by `scripts/build-models.mjs`.

Uni-CLI-specific models live in `src/models/uni-cli-models.json`. `scripts/build-models.mjs` turns that list into the Uni-CLI provider overlay at build time and switches the provider API URL based on `UNICLI_DEV_MODE`.

Local development still serves the generated catalog from the inference Hono app at `/models/api.json` so one local service can provide both the proxy API and model catalog during dev.
