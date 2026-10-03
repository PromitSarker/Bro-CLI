/** @jsxImportSource react */
import {
  createContext,
  use,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { uniCliServerStore } from "./uni-cli-server-store";

const uniCliServerContext = createContext<uniCliServerStore | null>(null);

export function uniCliServerProvider(props: {
  store: uniCliServerStore;
  children: ReactNode;
}) {
  return (
    <uniCliServerContext.Provider value={props.store}>
      {props.children}
    </uniCliServerContext.Provider>
  );
}

export function useuniCliServer() {
  const store = use(uniCliServerContext);
  if (!store) {
    throw new Error("useuniCliServer must be used within an uniCliServerProvider");
  }

  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return store;
}
