// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron"

// Store event listeners to properly clean them up
const eventListeners = new Map<string, Array<(data: { message: string; progress: number }) => void>>()

contextBridge.exposeInMainWorld("electron", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getVideosFromFolder: (folderPath: string) => ipcRenderer.invoke("get-videos-from-folder", folderPath),
  getCourseStructure: (rootPath: string) => ipcRenderer.invoke("get-course-structure", rootPath),
  getVideoFile: (filePath: string) => ipcRenderer.invoke("get-video-file", filePath),
  findSubtitleFiles: (videoPath: string) => ipcRenderer.invoke("find-subtitle-files", videoPath),
  saveNotes: (data: { courseName: string; videoName: string; content: string }) => 
    ipcRenderer.invoke("save-notes", data),
  loadNotes: (data: { courseName: string; videoName: string }) => 
    ipcRenderer.invoke("load-notes", data),
  getAppDataPath: () => ipcRenderer.invoke("get-app-data-path"),
  saveVideoPosition: (data: { courseName: string; videoName: string; position: number }) =>
    ipcRenderer.invoke("save-video-position", data),
  getVideoPosition: (data: { courseName: string; videoName: string }) =>
    ipcRenderer.invoke("get-video-position", data),
  platform: process.platform,
  testIpc: () => ipcRenderer.invoke("test-ipc"),
  
  // Add method to get app icon path
  getAppIconPath: () => ipcRenderer.invoke("get-app-icon-path"),
  
  // Add method to open external file
  openExternal: (filePath: string) => ipcRenderer.invoke("open-external", filePath),
  
  // Add method to get file stats
  getFileStats: (filePath: string) => ipcRenderer.invoke("get-file-stats", filePath),
  
  // Add method to show notification
  showNotification: (title: string, body: string) => ipcRenderer.invoke("show-notification", title, body),

  // Add methods for handling progress updates
  onCourseLoadingProgress: (callback: (data: { message: string; progress: number }) => void) => {
    const channel = "course-loading-progress"
    
    // Store the listener for cleanup
    if (!eventListeners.has(channel)) {
      eventListeners.set(channel, [])
    }
    const listeners = eventListeners.get(channel)
    if (listeners) {
      listeners.push(callback)
    }
    
    // Add the IPC listener
    ipcRenderer.on(channel, (_event, data) => callback(data))
  },
  
  removeCourseLoadingProgressListener: (callback: (data: { message: string; progress: number }) => void) => {
    const channel = "course-loading-progress"
    
    // Remove the listener
    if (eventListeners.has(channel)) {
      const listeners = eventListeners.get(channel)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
        
        // If no more listeners, remove the IPC listener
        if (listeners.length === 0) {
          ipcRenderer.removeAllListeners(channel)
          eventListeners.delete(channel)
        }
      }
    }
  }
})