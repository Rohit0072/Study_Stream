// electron/main.ts
import { app, BrowserWindow, dialog, ipcMain, protocol, shell } from "electron"
import { readdir, stat, readFile } from "fs/promises"
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { createServer, IncomingMessage, ServerResponse } from "http"
import path from "path"
import { URL } from "url"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

let mainWindow: BrowserWindow | null = null
let httpServer: any = null

// Create a simple HTTP server for the renderer files
function createRendererServer(rendererPath: string) {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    try {
      // Handle requests for icons
      if (req.url?.startsWith('/icons/')) {
        const iconPath = path.join(rendererPath, req.url)
        
        if (existsSync(iconPath)) {
          const iconData = readFileSync(iconPath)
          res.writeHead(200, { 
            'Content-Type': 'image/png',
            'Access-Control-Allow-Origin': '*'
          })
          res.end(iconData)
        } else {
          res.writeHead(404)
          res.end('Icon not found')
        }
        return
      }
      
      // For hash routing, always serve index.html for any route
      if (req.url === '/' || req.url?.includes('/#')) {
        const indexPath = path.join(rendererPath, 'index.html')
        const content = readFileSync(indexPath, 'utf8')
        res.writeHead(200, { 
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(content, 'utf-8')
        return
      }
      
      let filePath = path.join(rendererPath, req.url || '')
      
      // Security check - prevent directory traversal
      if (!filePath.startsWith(rendererPath)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }
      
      const extname = path.extname(filePath)
      let contentType = 'text/html'
      
      switch (extname) {
        case '.js':
          contentType = 'text/javascript'
          break
        case '.css':
          contentType = 'text/css'
          break
        case '.json':
          contentType = 'application/json'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.jpg':
          contentType = 'image/jpg'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.svg':
          contentType = 'image/svg+xml'
          break
        case '.wav':
          contentType = 'audio/wav'
          break
      }
      
      try {
        let content: string | Buffer
        
        // For text files, read as UTF-8
        if (['.js', '.css', '.json', '.html', '.svg'].includes(extname)) {
          content = readFileSync(filePath, 'utf8')
        } else {
          // For binary files, read as buffer
          content = readFileSync(filePath)
        }
        
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        })
        res.end(content)
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // If file not found, serve index.html for hash routing
          const indexPath = path.join(rendererPath, 'index.html')
          const indexContent = readFileSync(indexPath, 'utf8')
          res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
          })
          res.end(indexContent, 'utf-8')
        } else {
          res.writeHead(500)
          res.end('Server error')
        }
      }
    } catch (error) {
      console.error('Server error:', error)
      res.writeHead(500)
      res.end('Server error')
    }
  })
  
  // Find an available port
  const port = 3456
  server.listen(port, 'localhost', () => {
    console.log(`Renderer server running on http://localhost:${port}`)
  })
  
  return { server, port }
}

// Create the main window
function createWindow() {
  // Get the appropriate icon based on the platform
  const getIconPath = () => {
    if (app.isPackaged) {
      // Try different possible icon paths in packaged app
      const possibleIconPaths = [
        path.join(process.resourcesPath, "icons", process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
        path.join(__dirname, "..", "..", "icons", process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
        path.join(app.getAppPath(), "icons", process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png')
      ]
      
      for (const iconPath of possibleIconPaths) {
        if (existsSync(iconPath)) {
          return iconPath
        }
      }
      return undefined // If no icon found, let Electron use default
    } else {
      // In development
      if (process.platform === 'win32') {
        return path.join(__dirname, "../../public/icons/icon.ico")
      } else if (process.platform === 'darwin') {
        return path.join(__dirname, "../../public/icons/icon.icns")
      } else {
        return path.join(__dirname, "../../public/icons/icon.png")
      }
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false, // Only for development
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (app.isPackaged) {
    // For packaged app, find the correct path to renderer directory
    let rendererPath: string = ''
    
    // Try different possible paths
    const possiblePaths = [
      path.join(process.resourcesPath, "app", "dist", "renderer"),
      path.join(__dirname, "..", "renderer"),
      path.join(__dirname, "..", "..", "dist", "renderer"),
      path.join(process.cwd(), "dist", "renderer"),
      path.join(app.getAppPath(), "dist", "renderer")
    ]
    
    for (const possiblePath of possiblePaths) {
      if (existsSync(possiblePath)) {
        rendererPath = possiblePath
        break
      }
    }
    
    if (!rendererPath) {
      console.error("Could not find renderer directory!")
      if (mainWindow) {
        mainWindow.webContents.loadURL(`data:text/html,<html><body><h1>Error: Could not find application files</h1><p>Please reinstall the application.</p></body></html>`)
      }
      return
    }
    
    console.log("Found renderer directory at:", rendererPath)
    
    // Create HTTP server for renderer files
    const { server, port } = createRendererServer(rendererPath)
    httpServer = server
    
    // Wait a bit for the server to start, then load the app
    setTimeout(() => {
      if (mainWindow) {
        console.log(`Loading app from http://localhost:${port}`)
        mainWindow.loadURL(`http://localhost:${port}`)
        
        // Open DevTools in packaged app for debugging (remove in production)
        // mainWindow.webContents.openDevTools()
      }
    }, 100)
    
    // Handle all navigation requests
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl)
      
      // Allow only localhost requests
      if (parsedUrl.hostname !== 'localhost') {
        event.preventDefault()
      }
    })
    
    // Handle new window requests
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // Prevent opening new windows
      return { action: 'deny' }
    })
  } else {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on("closed", () => {
    mainWindow = null
    if (httpServer) {
      httpServer.close()
      httpServer = null
    }
  })
}

app.whenReady().then(() => {
  console.log("App ready, isPackaged:", app.isPackaged)
  console.log("App path:", app.getAppPath())
  console.log("__dirname:", __dirname)
  console.log("process.resourcesPath:", process.resourcesPath)
  
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// -------------------- IPC HANDLERS --------------------

// Test IPC handler
ipcMain.handle("test-ipc", () => {
  console.log("Test IPC handler called")
  return "IPC is working!"
})

// Get app icon path
ipcMain.handle("get-app-icon-path", () => {
  if (app.isPackaged) {
    // Try different possible icon paths in packaged app
    const possibleIconPaths = [
      path.join(process.resourcesPath, "icons", "icon.png"),
      path.join(__dirname, "..", "..", "icons", "icon.png"),
      path.join(app.getAppPath(), "icons", "icon.png")
    ]
    
    for (const iconPath of possibleIconPaths) {
      if (existsSync(iconPath)) {
        console.log("Found icon at:", iconPath)
        return iconPath
      }
    }
    
    // Try to find it in the renderer directory
    const rendererIconPath = path.join(process.resourcesPath, "app", "dist", "renderer", "icons", "icon.png")
    if (existsSync(rendererIconPath)) {
      console.log("Found icon in renderer at:", rendererIconPath)
      return rendererIconPath
    }
  } else {
    // In development, return the URL that will be served by Vite
    return "http://localhost:5173/icons/icon.png"
  }
  
  // Fallback to a default
  console.log("Icon not found, returning empty string")
  return ""
})

// Select a folder
ipcMain.handle("select-folder", async () => {
  console.log("select-folder IPC handler called")
  if (!mainWindow) return null
  
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Course Folder",
    })
    
    console.log("Dialog result:", result)
    
    if (result.canceled || result.filePaths.length === 0) {
      console.log("Folder selection canceled")
      return null
    }
    
    console.log("Selected folder:", result.filePaths[0])
    return result.filePaths[0]
  } catch (error) {
    console.error("Error in select-folder:", error)
    return null
  }
})

// Get videos from folder
ipcMain.handle("get-videos-from-folder", async (_event, folderPath: string) => {
  console.log("get-videos-from-folder called with:", folderPath)
  return await getVideosFromFolder(folderPath)
})

// Get course structure - Updated to handle the new hierarchy
ipcMain.handle("get-course-structure", async (_event, rootPath: string) => {
  console.log("Getting course structure from:", rootPath)
  
  try {
    // Extract course name from the folder path
    const courseName = path.basename(rootPath)
    console.log("Course name:", courseName)
    
    // Get directory entries without file stats first
    const entries = await readdir(rootPath, { withFileTypes: true })
    console.log("Directory entries:", entries)
    
    // Filter only directories first
    const sectionDirs = entries.filter(entry => entry.isDirectory())
    console.log("Section directories:", sectionDirs.map(d => d.name))
    
    // Process sections sequentially with progress updates
    const validSections = []
    const totalSections = sectionDirs.length
    
    // Send initial progress to renderer
    if (mainWindow) {
      mainWindow.webContents.send("course-loading-progress", {
        message: `Processing ${totalSections} sections...`,
        progress: 0
      })
    }
    
    for (let i = 0; i < sectionDirs.length; i++) {
      const entry = sectionDirs[i]
      const sectionPath = path.join(rootPath, entry.name)
      console.log(`Processing section ${i + 1}/${totalSections}:`, sectionPath)
      
      try {
        // Update progress
        if (mainWindow) {
          mainWindow.webContents.send("course-loading-progress", {
            message: `Processing section ${entry.name} (${i + 1}/${totalSections})...`,
            progress: Math.round((i / totalSections) * 100)
          })
        }
        
        const videos = await getVideosFromFolder(sectionPath)
        console.log("Videos found in", entry.name, ":", videos)
        
        if (videos.length > 0) {
          validSections.push({
            name: entry.name,
            path: sectionPath,
            videos: videos.map((video) => ({
              name: video.name,
              path: video.path,
              duration: video.duration || "00:00",
              progress: 0,
            })),
          })
        }
      } catch (error) {
        console.error(`Error processing section ${entry.name}:`, error)
        // Continue with next section even if one fails
      }
    }
    
    // Send final progress
    if (mainWindow) {
      mainWindow.webContents.send("course-loading-progress", {
        message: "Finalizing course structure...",
        progress: 100
      })
    }
    
    // Return a single course with sections
    const courseStructure = [{
      name: courseName,
      path: rootPath,
      sections: validSections
    }]
    
    console.log("Final course structure:", courseStructure)
    return courseStructure
  } catch (error) {
    console.error("Error getting course structure:", error)
    return []
  }
})

// Get a single video file path - Using file:// protocol
ipcMain.handle("get-video-file", async (_event, filePath: string) => {
  console.log("get-video-file called with:", filePath)
  
  try {
    // Check if the file exists
    if (existsSync(filePath)) {
      // For video files, return the file:// URL
      if (isVideoFile(filePath)) {
        console.log("Returning video file URL:", `file://${filePath}`)
        return `file://${filePath}`
      }
      // For subtitle files, read the content and return it
      else if (isSubtitleFile(filePath)) {
        console.log("Reading subtitle file content:", filePath)
        const content = await readFile(filePath, 'utf8')
        return content
      }
    } else {
      console.error("File does not exist:", filePath)
    }
    
    return null
  } catch (error) {
    console.error("Error getting file:", error)
    return null
  }
})

// New handler to find subtitle files for a video
ipcMain.handle("find-subtitle-files", async (_event, videoPath: string) => {
  console.log("find-subtitle-files called with:", videoPath)
  
  try {
    const videoDir = path.dirname(videoPath)
    const videoName = path.basename(videoPath, path.extname(videoPath))
    
    console.log("Video directory:", videoDir)
    console.log("Video name without extension:", videoName)
    
    // Look for subtitle files with the same name as the video
    const files = await readdir(videoDir)
    console.log("All files in directory:", files)
    
    const subtitleFiles: { type: string; content: string }[] = []
    
    for (const file of files) {
      const fileBaseName = path.basename(file, path.extname(file))
      const ext = path.extname(file).toLowerCase()
      
      console.log(`Checking file: ${file}, basename: ${fileBaseName}, ext: ${ext}`)
      
      // Check if it's a subtitle file with the same base name as the video
      if ((ext === ".srt" || ext === ".vtt") && fileBaseName === videoName) {
        const filePath = path.join(videoDir, file)
        console.log("Found matching subtitle file:", filePath)
        
        try {
          const content = await readFile(filePath, 'utf8')
          subtitleFiles.push({
            type: ext,
            content: content
          })
          console.log(`Successfully read ${ext} file, content length: ${content.length}`)
        } catch (error) {
          console.error("Error reading subtitle file:", error)
        }
      }
    }
    
    console.log("Found subtitle files:", subtitleFiles.length)
    return subtitleFiles
  } catch (error) {
    console.error("Error finding subtitle files:", error)
    return []
  }
})

// New handler to list all files in a directory (for debugging)
ipcMain.handle("list-directory-files", async (_event, dirPath: string) => {
  console.log("list-directory-files called with:", dirPath)
  
  try {
    const files = await readdir(dirPath)
    const fileDetails = []
    
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stats = await stat(filePath)
      
      fileDetails.push({
        name: file,
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        extension: path.extname(file).toLowerCase()
      })
    }
    
    console.log("Directory files:", fileDetails)
    return fileDetails
  } catch (error) {
    console.error("Error listing directory files:", error)
    return []
  }
})

// Save notes
ipcMain.handle("save-notes", (_event, data: { courseName: string; videoName: string; content: string }) => {
  try {
    const notesDir = path.join(app.getPath("appData"), "notes", data.courseName)
    if (!existsSync(notesDir)) {
      mkdirSync(notesDir, { recursive: true })
    }
    const sanitizedName = data.videoName.replace(/[/\\?%*:|"<>]/g, "-")
    const notesPath = path.join(notesDir, `${sanitizedName}.txt`)
    writeFileSync(notesPath, data.content)
    return true
  } catch (error) {
    console.error("Error saving notes:", error)
    return false
  }
})

// Load notes
ipcMain.handle("load-notes", (_event, data: { courseName: string; videoName: string }) => {
  try {
    const sanitizedName = data.videoName.replace(/[/\\?%*:|"<>]/g, "-")
    const notesPath = path.join(app.getPath("appData"), "notes", data.courseName, `${sanitizedName}.txt`)
    if (existsSync(notesPath)) return readFileSync(notesPath, "utf8")
    return ""
  } catch (error) {
    console.error("Error loading notes:", error)
    return ""
  }
})

// Get app data path
ipcMain.handle("get-app-data-path", () => {
  return app.getPath("appData")
})

// Save video position
ipcMain.handle("save-video-position", (_event, data: { courseName: string; videoName: string; position: number }) => {
  try {
    const positionsDir = path.join(app.getPath("appData"), "video-positions")
    if (!existsSync(positionsDir)) {
      mkdirSync(positionsDir, { recursive: true })
    }
    
    const coursePositionsPath = path.join(positionsDir, `${data.courseName}.json`)
    let positions: Record<string, number> = {}
    
    if (existsSync(coursePositionsPath)) {
      positions = JSON.parse(readFileSync(coursePositionsPath, "utf8"))
    }
    
    positions[data.videoName] = data.position
    writeFileSync(coursePositionsPath, JSON.stringify(positions))
    return true
  } catch (error) {
    console.error("Error saving video position:", error)
    return false
  }
})

// Get video position
ipcMain.handle("get-video-position", (_event, data: { courseName: string; videoName: string }) => {
  try {
    const coursePositionsPath = path.join(app.getPath("appData"), "video-positions", `${data.courseName}.json`)
    
    if (existsSync(coursePositionsPath)) {
      const positions = JSON.parse(readFileSync(coursePositionsPath, "utf8"))
      return positions[data.videoName] || 0
    }
    
    return 0
  } catch (error) {
    console.error("Error getting video position:", error)
    return 0
  }
})

// Open file in external application
ipcMain.handle("open-external", async (_event, filePath: string) => {
  try {
    await shell.openPath(filePath)
    return true
  } catch (error) {
    console.error("Error opening external file:", error)
    return false
  }
})

// Get file stats
ipcMain.handle("get-file-stats", async (_event, filePath: string) => {
  try {
    const stats = await stat(filePath)
    return {
      size: stats.size,
      mtime: stats.mtime.getTime(),
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    }
  } catch (error) {
    console.error("Error getting file stats:", error)
    return null
  }
})

// -------------------- HELPER FUNCTIONS --------------------

function isVideoFile(filename: string) {
  const videoExtensions = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".wmv", ".flv"]
  const ext = path.extname(filename).toLowerCase()
  return videoExtensions.includes(ext)
}

function isSubtitleFile(filename: string) {
  const subtitleExtensions = [".srt", ".vtt"]
  const ext = path.extname(filename).toLowerCase()
  return subtitleExtensions.includes(ext)
}

// Get video duration using ffprobe (part of ffmpeg)
async function getVideoDuration(filePath: string): Promise<string> {
  try {
    // Try to use ffprobe to get video duration
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`)
    const durationSeconds = parseFloat(stdout.trim())
    
    if (!isNaN(durationSeconds)) {
      const minutes = Math.floor(durationSeconds / 60)
      const seconds = Math.floor(durationSeconds % 60)
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
  } catch (error) {
    console.error("Error getting video duration with ffprobe:", error)
  }
  
  // Fallback to a default duration
  return "00:00"
}

async function getVideosFromFolder(folderPath: string) {
  console.log("Getting videos from folder:", folderPath)
  
  try {
    const files = await readdir(folderPath)
    console.log("Files in folder:", files)
    
    // Filter only video files first
    const videoFiles = files.filter(file => isVideoFile(file))
    console.log("Video files:", videoFiles)
    
    // Process video files in parallel with limited concurrency
    const videoPromises = videoFiles.map(async (file) => {
      const filePath = path.join(folderPath, file)
      
      try {
        const stats = await stat(filePath)
        
        // Get video duration (this might be slow, so we'll make it optional)
        let duration = "00:00"
        try {
          duration = await getVideoDuration(filePath)
        } catch (error) {
          console.error(`Error getting duration for ${file}:`, error)
        }
        
        return {
          name: file,
          path: filePath,
          duration: duration,
          size: stats.size,
          lastModified: stats.mtime.getTime(),
        }
      } catch (error) {
        console.error(`Error processing video file ${file}:`, error)
        return null
      }
    })
    
    // Wait for all videos to process with a timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout processing video files")), 15000)
    )
    
    const processedVideos = await Promise.race([
      Promise.all(videoPromises),
      timeoutPromise
    ]) as any[]
    
    // Filter out null videos
    const validVideos = processedVideos.filter(video => video !== null)
    
    // Sort by numeric prefix if available, else alphabetical
    validVideos.sort((a, b) => {
      const aMatch = a.name.match(/^(\d+)/)
      const bMatch = b.name.match(/^(\d+)/)
      if (aMatch && bMatch) return Number(aMatch[1]) - Number(bMatch[1])
      return a.name.localeCompare(b.name)
    })

    console.log("Video files found:", validVideos)
    return validVideos
  } catch (error) {
    console.error("Error reading folder:", error)
    return []
  }
}