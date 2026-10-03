import { signIn } from "@uni-cli/behaviors";
import { captureBrowserFilm } from "@uni-cli/cdp";
import type { Seed } from "@uni-cli/env";

export async function signupWorkspace(seed: Seed, options: { filmDirectory?: string; viewport?: { width: number; height: number } } = {}) {
  // Capture real rendered emails locally; never use an inherited mail provider.
  const den = await seed.den({ provision: false, env: {
    UNICLI_DEV_MODE: "1", RESEND_API_KEY: "", SMTP_HOST: "",
    DEN_REQUIRE_EMAIL_VERIFICATION: "false",
    DEN_UNICLI_WEB_ENABLED: "true",
  } });
  const owner = {
    name: "Workspace Owner",
    email: `workspace-owner-${Date.now()}@uni-cli.test`,
    password: "Uni-CLI-proof-9274!suitable",
  };
  const web = await seed.web({ den, startPath: "/", headless: true, viewport: options.viewport ?? { width: 1600, height: 1000 } });
  const filmDirectory = options.filmDirectory ?? process.env.UNICLI_EVAL_FILM_DIR;
  const film = filmDirectory ? await captureBrowserFilm(web, filmDirectory) : null;
  return {
    den, web, owner, film,
    async [Symbol.asyncDispose]() { await film?.stop(); },
    invitees: ["casey@uni-cli.test", "jordan@uni-cli.test"],
    rejectedEmail: "jordan@outside.test",
    async adoptSignedInOwner() {
      // Read witnesses use the same account that the user created through the UI.
      den.admin = await signIn(den.ref, owner);
    },
    async pathname() {
      const path = await seed.evalIn(web, () => (window.location.pathname));
      if (typeof path !== "string") throw new Error("Expected browser path");
      return path;
    },
  };
}
