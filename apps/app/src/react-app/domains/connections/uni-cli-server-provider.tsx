/** @jsxImportSource react */
import {
  createContext,
  use,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { uni-cliServerStore } from "./uni-cli-server-store";

const uni-cliServerContext = createContext<uni-cliServerStore | null>(null);

export function uni-cliServerProvider(props: {
  store: uni-cliServerStore;
  children: ReactNode;
}) {
  return (
    <uni-cliServerContext.Provider value={props.store}>
      {props.children}
    </uni-cliServerContext.Provider>
  );
}

export function useuni-cliServer() {
  const store = use(uni-cliServerContext);
  if (!store) {
    throw new Error("useuni-cliServer must be used within an uni-cliServerProvider");
  }

  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return store;
}
