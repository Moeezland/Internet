const { app, BrowserWindow, WebContentsView, ipcMain, session } = require("electron");
const path = require("node:path");

const HOME_URL = "https://www.google.com/";
const BROWSER_PARTITION = "persist:moeezland-browser";
const TOOLBAR_HEIGHT = 76;

let mainWindow;
let browserView;

function parseWebUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function assertTrustedUiSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame) {
    throw new Error("Untrusted IPC sender");
  }
  const senderUrl = event.senderFrame.url;
  if (!senderUrl.startsWith("file://") || !senderUrl.endsWith("/index.html")) {
    throw new Error("IPC is only available to the application UI");
  }
}

function sendToUi(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function updateNavigationState() {
  if (!browserView || browserView.webContents.isDestroyed()) return;
  sendToUi("browser:state", {
    canGoBack: browserView.webContents.canGoBack(),
    canGoForward: browserView.webContents.canGoForward(),
    isLoading: browserView.webContents.isLoading(),
    url: browserView.webContents.getURL()
  });
}

function navigate(value) {
  const safeUrl = parseWebUrl(value);
  if (!safeUrl || !browserView) {
    sendToUi("browser:error", "That address is not allowed. Use an http:// or https:// website.");
    return false;
  }
  browserView.webContents.loadURL(safeUrl).catch((error) => {
    sendToUi("browser:error", `Could not load page: ${error.message}`);
  });
  return true;
}

function configureBrowserSession(browserSession) {
  // This browser starter intentionally denies all site permissions by default.
  browserSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  browserSession.setPermissionCheckHandler(() => false);

  browserSession.on("will-download", (_event, item) => {
    // Downloads are allowed through Chromium's normal download manager.
    // No automatic execution or opening of downloaded files is performed.
    item.setSaveDialogOptions({ title: "Save download" });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 520,
    title: "Moeezland Internet",
    icon: path.join(__dirname, "logo.png"),
    backgroundColor: "#f5f7fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });

  browserView = new WebContentsView({
    webPreferences: {
      partition: BROWSER_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      javascript: true,
      webviewTag: false,
      devTools: !app.isPackaged
    }
  });

  mainWindow.contentView.addChildView(browserView);
  const setBrowserBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const { width, height } = mainWindow.getContentBounds();
    browserView.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width,
      height: Math.max(0, height - TOOLBAR_HEIGHT)
    });
  };
  setBrowserBounds();
  mainWindow.on("resize", setBrowserBounds);

  const remoteContents = browserView.webContents;
  remoteContents.on("will-navigate", (event, url) => {
    if (!parseWebUrl(url)) event.preventDefault();
  });
  remoteContents.on("will-frame-navigate", (event, url) => {
    if (!parseWebUrl(url)) event.preventDefault();
  });
  remoteContents.on("will-redirect", (event, url) => {
    if (!parseWebUrl(url)) event.preventDefault();
  });
  remoteContents.setWindowOpenHandler(({ url }) => {
    const safeUrl = parseWebUrl(url);
    if (safeUrl) {
      setImmediate(() => navigate(safeUrl));
    }
    return { action: "deny" };
  });
  remoteContents.on("will-attach-webview", (event) => event.preventDefault());
  remoteContents.on("did-navigate", (_event, url) => {
    sendToUi("browser:navigation", { url });
    updateNavigationState();
  });
  remoteContents.on("did-navigate-in-page", (_event, url) => {
    sendToUi("browser:navigation", { url });
    updateNavigationState();
  });
  remoteContents.on("page-title-updated", (_event, title) => {
    sendToUi("browser:title", title);
  });
  remoteContents.on("did-start-loading", updateNavigationState);
  remoteContents.on("did-stop-loading", updateNavigationState);
  remoteContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame && errorCode !== -3) {
      sendToUi("browser:error", `Page load failed: ${errorDescription}`);
    }
    updateNavigationState();
  });

  // The app chrome is local content only. Do not let it navigate to websites.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  mainWindow.on("closed", () => {
    browserView = null;
    mainWindow = null;
  });

  mainWindow.loadFile("index.html");
  remoteContents.loadURL(HOME_URL).catch((error) => {
    sendToUi("browser:error", `Could not open the home page: ${error.message}`);
  });
}

app.whenReady().then(() => {
  const browserSession = session.fromPartition(BROWSER_PARTITION);
  configureBrowserSession(browserSession);

  ipcMain.handle("browser:navigate", (event, value) => {
    assertTrustedUiSender(event);
    return navigate(String(value ?? ""));
  });
  ipcMain.handle("browser:back", (event) => {
    assertTrustedUiSender(event);
    if (browserView?.webContents.canGoBack()) browserView.webContents.goBack();
    updateNavigationState();
  });
  ipcMain.handle("browser:forward", (event) => {
    assertTrustedUiSender(event);
    if (browserView?.webContents.canGoForward()) browserView.webContents.goForward();
    updateNavigationState();
  });
  ipcMain.handle("browser:reload", (event) => {
    assertTrustedUiSender(event);
    browserView?.webContents.reload();
  });
  ipcMain.handle("browser:home", (event) => {
    assertTrustedUiSender(event);
    return navigate(HOME_URL);
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => event.preventDefault());
});
