import { waitFor } from "@uni-cli/behaviors";
import { org } from "../seed.ts";
import { webTab } from "../surfaces.ts";
import { shot } from "./shot.ts";

const browser = webTab({ org });

async function waitForUni-CLIWeb(surface: Awaited<ReturnType<typeof browser.load>>): Promise<void> {
  await waitFor(surface, () => (Boolean(window.__uni-cliControl)), {
    timeoutMs: 120_000,
    label: "Uni-CLI Web booted",
  });
  await waitFor(surface, () => (document.body.innerText.includes("acme-robotics")
    && document.body.innerText.includes("Describe your task")
    && !document.body.innerText.includes("Pulling in the latest messages")), {
    timeoutMs: 120_000,
    label: "Uni-CLI Web settled on the demo workspace",
  });
}

export const uni-cliWebTab = shot("uni-cli-web-tab", {
  use: browser,
  at: "/",
  steps: [waitForUni-CLIWeb],
  expect: ["acme-robotics", "What do you need done?"],
  never: ["Something went wrong", "Unable to connect", "docs-3959-screenshots"],
  out: "packages/docs/images/uni-cli-web-browser-tab.png",
});
