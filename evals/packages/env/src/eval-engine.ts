import { resolveEvalEngineValue } from "@uni-cli/hosts/eval-engine";
import type { EvalEngine } from "@uni-cli/hosts/eval-engine";

export type { EvalEngine } from "@uni-cli/hosts/eval-engine";

export function resolveEvalEngine(env: NodeJS.ProcessEnv = process.env): EvalEngine {
  return resolveEvalEngineValue(env.UNICLI_EVAL_ENGINE);
}
