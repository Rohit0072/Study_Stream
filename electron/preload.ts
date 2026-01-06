import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    selectFolder: () => ipcRenderer.invoke("select-directory"),
    scanDirectory: (path: string) => ipcRenderer.invoke("scan-directory", path),
    sendNotification: (title: string, body: string) => ipcRenderer.invoke("send-notification", { title, body }),
    saveImage: (url: string, courseId: string) => ipcRenderer.invoke("save-image", { url, courseId }),
    proxyRequest: (url: string, options: any) => ipcRenderer.invoke("proxy-request", { url, ...options }),
    readSubtitle: (path: string) => ipcRenderer.invoke("read-subtitle", path),
});
