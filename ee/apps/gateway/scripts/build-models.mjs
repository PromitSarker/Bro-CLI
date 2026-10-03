import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(__dirname, "..")
const sourceDir = path.join(appDir, "src", "models")
const outputPath = path.join(appDir, "models-site", "models", "api.json")
const devuniCliApi = "http://127.0.0.1:8791/api/v1"
const produniCliApi = "https://inference.uni-clilabs.com/api/v1"

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"))
}

function uniCliProvider(models, api) {
  return {
    uni-cli: {
      id: "uni-cli",
      env: ["UNICLI_API_KEY"],
      npm: "@openrouter/ai-sdk-provider",
      name: "Uni-CLI Models",
      api,
      models,
    },
  }
}

const isDevMode = process.env.UNICLI_DEV_MODE === "1"
const base = await readJson(path.join(sourceDir, "base.json"))
const uniCliModels = await readJson(path.join(sourceDir, "uni-cli-models.json"))
const uni-cli = uniCliProvider(uniCliModels, isDevMode ? devuniCliApi : produniCliApi)
const models = { ...base, ...uni-cli }

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(models)}\n`)

console.log(`[gateway] generated ${path.relative(appDir, outputPath)} (${isDevMode ? "dev" : "prod"})`)
