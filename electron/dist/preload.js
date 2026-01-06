"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electron", {
    selectFolder: () => electron_1.ipcRenderer.invoke("select-directory"),
    scanDirectory: (path) => electron_1.ipcRenderer.invoke("scan-directory", path),
    sendNotification: (title, body) => electron_1.ipcRenderer.invoke("send-notification", { title, body }),
    saveImage: (url, courseId) => electron_1.ipcRenderer.invoke("save-image", { url, courseId }),
    proxyRequest: (url, options) => electron_1.ipcRenderer.invoke("proxy-request", Object.assign({ url }, options)),
    readSubtitle: (path) => electron_1.ipcRenderer.invoke("read-subtitle", path),
});
