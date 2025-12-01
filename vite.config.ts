// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  // Use absolute paths for production
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
    // Ensure assets are referenced correctly in the packaged app
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Ensure chunk files have consistent names
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    // Copy icons to the build output
    copyPublicDir: true
  },
  server: {
    // Ensure the server is accessible from Electron
    host: "localhost",
    port: 5173,
  },
  // Ensure proper module resolution
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  publicDir: 'public', // Ensure this is set to copy public files
})