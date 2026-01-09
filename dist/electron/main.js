"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// electron/main.ts
const electron_1 = require("electron");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let mainWindow = null;
// Create the main window
function createWindow() {
    // Get the appropriate icon based on the platform
    const getIconPath = () => {
        if (electron_1.app.isPackaged) {
            // Try different possible icon paths in packaged app
            const possibleIconPaths = [
                path_1.default.join(process.resourcesPath, "icons", process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
                path_1.default.join(__dirname, "..", "..", "icons", process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
                path_1.default.join(electron_1.app.getAppPath(), "icons", process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png')
            ];
            for (const iconPath of possibleIconPaths) {
                if ((0, fs_1.existsSync)(iconPath)) {
                    return iconPath;
                }
            }
            return undefined; // If no icon found, let Electron use default
        }
        else {
            // In development
            if (process.platform === 'win32') {
                return path_1.default.join(__dirname, "../../public/icons/icon.ico");
            }
            else if (process.platform === 'darwin') {
                return path_1.default.join(__dirname, "../../public/icons/icon.icns");
            }
            else {
                return path_1.default.join(__dirname, "../../public/icons/icon.png");
            }
        }
    };
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        icon: getIconPath(),
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            webSecurity: false, // Only for development
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (electron_1.app.isPackaged) {
        mainWindow.loadFile(path_1.default.join(__dirname, "../renderer/index.html"));
    }
    else {
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
// -------------------- IPC HANDLERS --------------------
// Test IPC handler
electron_1.ipcMain.handle("test-ipc", () => {
    console.log("Test IPC handler called");
    return "IPC is working!";
});
// Get app icon path
electron_1.ipcMain.handle("get-app-icon-path", () => {
    if (electron_1.app.isPackaged) {
        // Try different possible icon paths in packaged app
        const possibleIconPaths = [
            path_1.default.join(process.resourcesPath, "icons", "icon.png"),
            path_1.default.join(__dirname, "..", "..", "icons", "icon.png"),
            path_1.default.join(electron_1.app.getAppPath(), "icons", "icon.png")
        ];
        for (const iconPath of possibleIconPaths) {
            if ((0, fs_1.existsSync)(iconPath)) {
                console.log("Found icon at:", iconPath);
                return iconPath;
            }
        }
        // Try to find it in the renderer directory
        const rendererIconPath = path_1.default.join(process.resourcesPath, "app", "dist", "renderer", "icons", "icon.png");
        if ((0, fs_1.existsSync)(rendererIconPath)) {
            console.log("Found icon in renderer at:", rendererIconPath);
            return rendererIconPath;
        }
    }
    else {
        // In development, return the URL that will be served by Vite
        return "http://localhost:5173/icons/icon.png";
    }
    // Fallback to a default
    console.log("Icon not found, returning empty string");
    return "";
});
// Select a folder
electron_1.ipcMain.handle("select-folder", async () => {
    console.log("select-folder IPC handler called");
    if (!mainWindow)
        return null;
    try {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory"],
            title: "Select Course Folder",
        });
        console.log("Dialog result:", result);
        if (result.canceled || result.filePaths.length === 0) {
            console.log("Folder selection canceled");
            return null;
        }
        console.log("Selected folder:", result.filePaths[0]);
        return result.filePaths[0];
    }
    catch (error) {
        console.error("Error in select-folder:", error);
        return null;
    }
});
// Show notification
electron_1.ipcMain.handle("show-notification", (_event, title, body) => {
    if (electron_1.Notification.isSupported()) {
        new electron_1.Notification({ title, body }).show();
    }
});
// Get videos from folder
electron_1.ipcMain.handle("get-videos-from-folder", async (_event, folderPath) => {
    console.log("get-videos-from-folder called with:", folderPath);
    return await getVideosFromFolder(folderPath);
});
// Get course structure - Updated to handle the new hierarchy
electron_1.ipcMain.handle("get-course-structure", async (_event, rootPath) => {
    console.log("Getting course structure from:", rootPath);
    try {
        // Extract course name from the folder path
        const courseName = path_1.default.basename(rootPath);
        console.log("Course name:", courseName);
        // Get directory entries without file stats first
        const entries = await (0, promises_1.readdir)(rootPath, { withFileTypes: true });
        console.log("Directory entries:", entries);
        // Filter only directories first
        const sectionDirs = entries.filter(entry => entry.isDirectory());
        console.log("Section directories:", sectionDirs.map(d => d.name));
        // Process sections sequentially with progress updates
        const validSections = [];
        const totalSections = sectionDirs.length;
        // Send initial progress to renderer
        if (mainWindow) {
            mainWindow.webContents.send("course-loading-progress", {
                message: `Processing ${totalSections} sections...`,
                progress: 0
            });
        }
        for (let i = 0; i < sectionDirs.length; i++) {
            const entry = sectionDirs[i];
            const sectionPath = path_1.default.join(rootPath, entry.name);
            console.log(`Processing section ${i + 1}/${totalSections}:`, sectionPath);
            try {
                // Update progress
                if (mainWindow) {
                    mainWindow.webContents.send("course-loading-progress", {
                        message: `Processing section ${entry.name} (${i + 1}/${totalSections})...`,
                        progress: Math.round((i / totalSections) * 100)
                    });
                }
                const videos = await getVideosFromFolder(sectionPath);
                console.log("Videos found in", entry.name, ":", videos);
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
                    });
                }
            }
            catch (error) {
                console.error(`Error processing section ${entry.name}:`, error);
                // Continue with next section even if one fails
            }
        }
        // Send final progress
        if (mainWindow) {
            mainWindow.webContents.send("course-loading-progress", {
                message: "Finalizing course structure...",
                progress: 100
            });
        }
        // Return a single course with sections
        const courseStructure = [{
                name: courseName,
                path: rootPath,
                sections: validSections
            }];
        console.log("Final course structure:", courseStructure);
        return courseStructure;
    }
    catch (error) {
        console.error("Error getting course structure:", error);
        return [];
    }
});
// Get a single video file path - Using file:// protocol
electron_1.ipcMain.handle("get-video-file", async (_event, filePath) => {
    console.log("get-video-file called with:", filePath);
    try {
        // Check if the file exists
        if ((0, fs_1.existsSync)(filePath)) {
            // For video files, return the file:// URL
            if (isVideoFile(filePath)) {
                console.log("Returning video file URL:", `file://${filePath}`);
                return `file://${filePath}`;
            }
            // For subtitle files, read the content and return it
            else if (isSubtitleFile(filePath)) {
                console.log("Reading subtitle file content:", filePath);
                const content = await (0, promises_1.readFile)(filePath, 'utf8');
                return content;
            }
        }
        else {
            console.error("File does not exist:", filePath);
        }
        return null;
    }
    catch (error) {
        console.error("Error getting file:", error);
        return null;
    }
});
// New handler to find subtitle files for a video
electron_1.ipcMain.handle("find-subtitle-files", async (_event, videoPath) => {
    console.log("find-subtitle-files called with:", videoPath);
    try {
        const videoDir = path_1.default.dirname(videoPath);
        const videoName = path_1.default.basename(videoPath, path_1.default.extname(videoPath));
        console.log("Video directory:", videoDir);
        console.log("Video name without extension:", videoName);
        // Look for subtitle files with the same name as the video
        const files = await (0, promises_1.readdir)(videoDir);
        console.log("All files in directory:", files);
        const subtitleFiles = [];
        for (const file of files) {
            const fileBaseName = path_1.default.basename(file, path_1.default.extname(file));
            const ext = path_1.default.extname(file).toLowerCase();
            console.log(`Checking file: ${file}, basename: ${fileBaseName}, ext: ${ext}`);
            // Check if it's a subtitle file with the same base name as the video
            if ((ext === ".srt" || ext === ".vtt") && fileBaseName === videoName) {
                const filePath = path_1.default.join(videoDir, file);
                console.log("Found matching subtitle file:", filePath);
                try {
                    const content = await (0, promises_1.readFile)(filePath, 'utf8');
                    subtitleFiles.push({
                        type: ext,
                        content: content
                    });
                    console.log(`Successfully read ${ext} file, content length: ${content.length}`);
                }
                catch (error) {
                    console.error("Error reading subtitle file:", error);
                }
            }
        }
        console.log("Found subtitle files:", subtitleFiles.length);
        return subtitleFiles;
    }
    catch (error) {
        console.error("Error finding subtitle files:", error);
        return [];
    }
});
// New handler to list all files in a directory (for debugging)
electron_1.ipcMain.handle("list-directory-files", async (_event, dirPath) => {
    console.log("list-directory-files called with:", dirPath);
    try {
        const files = await (0, promises_1.readdir)(dirPath);
        const fileDetails = [];
        for (const file of files) {
            const filePath = path_1.default.join(dirPath, file);
            const stats = await (0, promises_1.stat)(filePath);
            fileDetails.push({
                name: file,
                path: filePath,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                extension: path_1.default.extname(file).toLowerCase()
            });
        }
        console.log("Directory files:", fileDetails);
        return fileDetails;
    }
    catch (error) {
        console.error("Error listing directory files:", error);
        return [];
    }
});
// Save notes
electron_1.ipcMain.handle("save-notes", (_event, data) => {
    try {
        const notesDir = path_1.default.join(electron_1.app.getPath("appData"), "notes", data.courseName);
        if (!(0, fs_1.existsSync)(notesDir)) {
            (0, fs_1.mkdirSync)(notesDir, { recursive: true });
        }
        const sanitizedName = data.videoName.replace(/[/\\?%*:|"<>]/g, "-");
        const notesPath = path_1.default.join(notesDir, `${sanitizedName}.txt`);
        (0, fs_1.writeFileSync)(notesPath, data.content);
        return true;
    }
    catch (error) {
        console.error("Error saving notes:", error);
        return false;
    }
});
// Load notes
electron_1.ipcMain.handle("load-notes", (_event, data) => {
    try {
        const sanitizedName = data.videoName.replace(/[/\\?%*:|"<>]/g, "-");
        const notesPath = path_1.default.join(electron_1.app.getPath("appData"), "notes", data.courseName, `${sanitizedName}.txt`);
        if ((0, fs_1.existsSync)(notesPath))
            return (0, fs_1.readFileSync)(notesPath, "utf8");
        return "";
    }
    catch (error) {
        console.error("Error loading notes:", error);
        return "";
    }
});
// Get app data path
electron_1.ipcMain.handle("get-app-data-path", () => {
    return electron_1.app.getPath("appData");
});
// Save video position
electron_1.ipcMain.handle("save-video-position", (_event, data) => {
    try {
        const positionsDir = path_1.default.join(electron_1.app.getPath("appData"), "video-positions");
        if (!(0, fs_1.existsSync)(positionsDir)) {
            (0, fs_1.mkdirSync)(positionsDir, { recursive: true });
        }
        const coursePositionsPath = path_1.default.join(positionsDir, `${data.courseName}.json`);
        let positions = {};
        if ((0, fs_1.existsSync)(coursePositionsPath)) {
            positions = JSON.parse((0, fs_1.readFileSync)(coursePositionsPath, "utf8"));
        }
        positions[data.videoName] = data.position;
        (0, fs_1.writeFileSync)(coursePositionsPath, JSON.stringify(positions));
        return true;
    }
    catch (error) {
        console.error("Error saving video position:", error);
        return false;
    }
});
// Get video position
electron_1.ipcMain.handle("get-video-position", (_event, data) => {
    try {
        const coursePositionsPath = path_1.default.join(electron_1.app.getPath("appData"), "video-positions", `${data.courseName}.json`);
        if ((0, fs_1.existsSync)(coursePositionsPath)) {
            const positions = JSON.parse((0, fs_1.readFileSync)(coursePositionsPath, "utf8"));
            return positions[data.videoName] || 0;
        }
        return 0;
    }
    catch (error) {
        console.error("Error getting video position:", error);
        return 0;
    }
});
// Open file in external application
electron_1.ipcMain.handle("open-external", async (_event, filePath) => {
    try {
        await electron_1.shell.openPath(filePath);
        return true;
    }
    catch (error) {
        console.error("Error opening external file:", error);
        return false;
    }
});
// Get file stats
electron_1.ipcMain.handle("get-file-stats", async (_event, filePath) => {
    try {
        const stats = await (0, promises_1.stat)(filePath);
        return {
            size: stats.size,
            mtime: stats.mtime.getTime(),
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory()
        };
    }
    catch (error) {
        console.error("Error getting file stats:", error);
        return null;
    }
});
// -------------------- HELPER FUNCTIONS --------------------
function isVideoFile(filename) {
    const videoExtensions = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".wmv", ".flv"];
    const ext = path_1.default.extname(filename).toLowerCase();
    return videoExtensions.includes(ext);
}
function isSubtitleFile(filename) {
    const subtitleExtensions = [".srt", ".vtt"];
    const ext = path_1.default.extname(filename).toLowerCase();
    return subtitleExtensions.includes(ext);
}
// Get video duration using ffprobe (part of ffmpeg)
async function getVideoDuration(filePath) {
    try {
        // Try to use ffprobe to get video duration
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
        const durationSeconds = parseFloat(stdout.trim());
        if (!isNaN(durationSeconds)) {
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = Math.floor(durationSeconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        }
    }
    catch (error) {
        console.error("Error getting video duration with ffprobe:", error);
    }
    // Fallback to a default duration
    return "00:00";
}
async function getVideosFromFolder(folderPath) {
    console.log("Getting videos from folder:", folderPath);
    try {
        const files = await (0, promises_1.readdir)(folderPath);
        console.log("Files in folder:", files);
        // Filter only video files first
        const videoFiles = files.filter(file => isVideoFile(file));
        console.log("Video files:", videoFiles);
        // Process video files in parallel with limited concurrency
        const videoPromises = videoFiles.map(async (file) => {
            const filePath = path_1.default.join(folderPath, file);
            try {
                const stats = await (0, promises_1.stat)(filePath);
                // Get video duration (this might be slow, so we'll make it optional)
                let duration = "00:00";
                try {
                    duration = await getVideoDuration(filePath);
                }
                catch (error) {
                    console.error(`Error getting duration for ${file}:`, error);
                }
                return {
                    name: file,
                    path: filePath,
                    duration: duration,
                    size: stats.size,
                    lastModified: stats.mtime.getTime(),
                };
            }
            catch (error) {
                console.error(`Error processing video file ${file}:`, error);
                return null;
            }
        });
        // Wait for all videos to process with a timeout
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout processing video files")), 15000));
        const processedVideos = await Promise.race([
            Promise.all(videoPromises),
            timeoutPromise
        ]);
        // Filter out null videos
        const validVideos = processedVideos.filter(video => video !== null);
        // Sort by numeric prefix if available, else alphabetical
        validVideos.sort((a, b) => {
            const aMatch = a.name.match(/^(\d+)/);
            const bMatch = b.name.match(/^(\d+)/);
            if (aMatch && bMatch)
                return Number(aMatch[1]) - Number(bMatch[1]);
            return a.name.localeCompare(b.name);
        });
        console.log("Video files found:", validVideos);
        return validVideos;
    }
    catch (error) {
        console.error("Error reading folder:", error);
        return [];
    }
}
//# sourceMappingURL=main.js.map