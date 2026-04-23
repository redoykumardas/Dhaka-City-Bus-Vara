"use client"

import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme("system")
    }
  }, [])

  const applyTheme = (t: "light" | "dark" | "system") => {
    const root = document.documentElement
    if (t === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.setAttribute("data-theme", systemTheme)
    } else {
      root.setAttribute("data-theme", t)
    }
  }

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(nextTheme)
    localStorage.setItem("theme", nextTheme)
    applyTheme(nextTheme)
  }

  return (
    <button onClick={toggleTheme} className="icon-btn" title="Toggle Theme">
      {theme === "light" && "☀️"}
      {theme === "dark" && "🌙"}
      {theme === "system" && "💻"}
    </button>
  )
}
