"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// electron/preload.ts
const electron_1 = require("electron");
// Store event listeners to properly clean them up
const eventListeners = new Map();
electron_1.contextBridge.exposeInMainWorld("electron", {
    selectFolder: () => electron_1.ipcRenderer.invoke("select-folder"),
    getVideosFromFolder: (folderPath) => electron_1.ipcRenderer.invoke("get-videos-from-folder", folderPath),
    getCourseStructure: (rootPath) => electron_1.ipcRenderer.invoke("get-course-structure", rootPath),
    getVideoFile: (filePath) => electron_1.ipcRenderer.invoke("get-video-file", filePath),
    findSubtitleFiles: (videoPath) => electron_1.ipcRenderer.invoke("find-subtitle-files", videoPath),
    saveNotes: (data) => electron_1.ipcRenderer.invoke("save-notes", data),
    loadNotes: (data) => electron_1.ipcRenderer.invoke("load-notes", data),
    getAppDataPath: () => electron_1.ipcRenderer.invoke("get-app-data-path"),
    saveVideoPosition: (data) => electron_1.ipcRenderer.invoke("save-video-position", data),
    getVideoPosition: (data) => electron_1.ipcRenderer.invoke("get-video-position", data),
    platform: process.platform,
    testIpc: () => electron_1.ipcRenderer.invoke("test-ipc"),
    // Add method to get app icon path
    getAppIconPath: () => electron_1.ipcRenderer.invoke("get-app-icon-path"),
    // Add method to open external file
    openExternal: (filePath) => electron_1.ipcRenderer.invoke("open-external", filePath),
    // Add method to get file stats
    getFileStats: (filePath) => electron_1.ipcRenderer.invoke("get-file-stats", filePath),
    // Add method to show notification
    showNotification: (title, body) => electron_1.ipcRenderer.invoke("show-notification", title, body),
    // Add methods for handling progress updates
    onCourseLoadingProgress: (callback) => {
        const channel = "course-loading-progress";
        // Store the listener for cleanup
        if (!eventListeners.has(channel)) {
            eventListeners.set(channel, []);
        }
        const listeners = eventListeners.get(channel);
        if (listeners) {
            listeners.push(callback);
        }
        // Add the IPC listener
        electron_1.ipcRenderer.on(channel, (_event, data) => callback(data));
    },
    removeCourseLoadingProgressListener: (callback) => {
        const channel = "course-loading-progress";
        // Remove the listener
        if (eventListeners.has(channel)) {
            const listeners = eventListeners.get(channel);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
                // If no more listeners, remove the IPC listener
                if (listeners.length === 0) {
                    electron_1.ipcRenderer.removeAllListeners(channel);
                    eventListeners.delete(channel);
                }
            }
        }
    }
});
//# sourceMappingURL=preload.js.map