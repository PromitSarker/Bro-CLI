import { setViewport } from "@uni-cli/cdp";
import type { Seed } from "@uni-cli/env";

export async function sidePanelAlignment(seed: Seed) {
  const den = await seed.den({ org: { name: "Pane alignment studio" } });
  const app = await seed.desktop({ name: "pane-alignment-member", den, as: "admin" });
  const signedOut = await seed.desktop({ name: "pane-alignment-signed-out", den, signIn: false });
  for (const surface of [app, signedOut]) {
    await setViewport(surface, { width: 1440, height: 900, deviceScaleFactor: 1 });
    // The report shows macOS chrome. Exercise its real CSS on Linux CI too,
    // without Linux's native titlebar-area inset (which CDP resizing cannot resize).
    // This arranges the platform only; the measured layout remains product CSS.
    await seed.evalIn(surface, () => {
      document.documentElement.classList.remove("uni-cli-platform-linux", "uni-cli-platform-windows");
      document.documentElement.classList.add("uni-cli-platform-mac");
    });
  }
  return { app, signedOut };
}
