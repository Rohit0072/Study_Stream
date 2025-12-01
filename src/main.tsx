// src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import { createHashRouter, RouterProvider } from "react-router-dom"
import "./index.css"

import HomePage from "./pages/home"
import LibraryPage from "./pages/library"
import PlaylistPage from "./pages/playlist"
import SettingsPage from "./pages/settings"
import BookmarksPage from "./pages/bookmarks"
import { AppProvider } from "./context/app-context"
import { ThemeProvider } from "./context/theme-context"

const router = createHashRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/library",
    element: <LibraryPage />,
  },
  {
    path: "/playlist/:course",
    element: <PlaylistPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/bookmarks",
    element: <BookmarksPage />,
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>,
)