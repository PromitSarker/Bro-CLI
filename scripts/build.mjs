import { execSync } from "node:child_process";

execSync("pnpm --filter @uni-cli/desktop build", { stdio: "inherit" });
