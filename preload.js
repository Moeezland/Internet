const { contextBridge, ipcRenderer } = require("electron");

const listeners = {
  navigation: (_event, data) => window.dispatchEvent(new CustomEvent("moeezland:navigation", { detail: data })),
  state: (_event, data) => window.dispatchEvent(new CustomEvent("moeezland:state", { detail: data })),
  title: (_event, data) => window.dispatchEvent(new CustomEvent("moeezland:title", { detail: data })),
  error: (_event, data) => window.dispatchEvent(new CustomEvent("moeezland:error", { detail: data }))
};

ipcRenderer.on("browser:navigation", listeners.navigation);
ipcRenderer.on("browser:state", listeners.state);
ipcRenderer.on("browser:title", listeners.title);
ipcRenderer.on("browser:error", listeners.error);

contextBridge.exposeInMainWorld("moeezland", Object.freeze({
  navigate: (url) => ipcRenderer.invoke("browser:navigate", url),
  back: () => ipcRenderer.invoke("browser:back"),
  forward: () => ipcRenderer.invoke("browser:forward"),
  reload: () => ipcRenderer.invoke("browser:reload"),
  home: () => ipcRenderer.invoke("browser:home")
}));
