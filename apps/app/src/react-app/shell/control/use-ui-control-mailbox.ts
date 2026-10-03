import { useEffect, type RefObject } from "react";
import type { uni-cliAffordanceRequest } from "@uni-cli/types/uni-cli-affordance";
import {
  createuni-cliServerClient,
  type uni-cliUiControlRequest,
} from "../../../app/lib/uni-cli-server";
import { resolveuni-cliConnection } from "../uni-cli-connection";
import type { uni-cliControlAPI } from "./control-provider";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function hasAffordanceId(input: unknown): input is uni-cliAffordanceRequest {
  return input !== null
    && typeof input === "object"
    && "id" in input
    && typeof input.id === "string"
    && input.id.trim().length > 0;
}

async function handleRequest(item: uni-cliUiControlRequest, api: uni-cliControlAPI): Promise<unknown> {
  if (item.kind === "context") return { ok: true, context: api.context() };
  if (!hasAffordanceId(item.input)) {
    return { ok: false, error: "Missing Uni-CLI affordance id." };
  }
  if (item.kind === "query") return api.query(item.input);
  return api.command(item.input);
}

export function useUiControlMailbox(apiRef: RefObject<uni-cliControlAPI | null>): void {
  useEffect(() => {
    if (import.meta.env.MODE === "test") return;

    let mounted = true;
    const controller = new AbortController();

    async function poll(): Promise<void> {
      while (mounted) {
        try {
          // Resolve again after each poll so switching servers or signing in
          // cannot leave this window answering a previous server's mailbox.
          const connection = await resolveuni-cliConnection();
          if (!mounted) return;
          if (!connection.normalizedBaseUrl || !connection.resolvedToken) {
            await wait(3_000);
            continue;
          }
          const client = createuni-cliServerClient({
            baseUrl: connection.normalizedBaseUrl,
            token: connection.resolvedToken,
            hostToken: connection.resolvedHostToken,
          });
          const { items } = await client.listUiControlPending({ wait: true, signal: controller.signal });
          if (!mounted) return;
          for (const item of items) {
            let result: unknown;
            try {
              const api = apiRef.current;
              if (!api) throw new Error("Uni-CLI control surface is not available yet.");
              result = await handleRequest(item, api);
            } catch (error) {
              result = { ok: false, error: error instanceof Error ? error.message : String(error) };
            }
            await client.replyUiControl(item.id, result);
          }
        } catch {
          if (mounted) await wait(2_000);
        }
      }
    }

    void poll();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [apiRef]);
}
