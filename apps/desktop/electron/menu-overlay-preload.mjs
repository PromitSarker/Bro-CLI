import { contextBridge, ipcRenderer } from "electron";

let latestRequest = null;
let showCallback = null;

ipcRenderer.on("uni-cli:menu-overlay:show", (_event, request) => {
  latestRequest = request;
  showCallback?.(request);
});

ipcRenderer.on("uni-cli:menu-overlay:hide", () => {
  latestRequest = null;
  showCallback?.(null);
});

contextBridge.exposeInMainWorld("__UNICLI_MENU_OVERLAY__", {
  ready() {
    ipcRenderer.send("uni-cli:menu-overlay:ready");
  },
  onShow(callback) {
    showCallback = callback;
    if (latestRequest) {
      callback(latestRequest);
    }
    return () => {
      if (showCallback === callback) {
        showCallback = null;
      }
    };
  },
  choose(requestId, itemId) {
    ipcRenderer.send("uni-cli:menu-overlay:choose", { requestId, itemId });
  },
  close(requestId) {
    ipcRenderer.send("uni-cli:menu-overlay:close", { requestId });
  },
});
