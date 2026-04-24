"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

const MODES: { value: Theme; icon: string; label: string }[] = [
  { value: "light",  icon: "☀️",  label: "Light"  },
  { value: "system", icon: "🌆", label: "Auto"   },
  { value: "dark",   icon: "🌙",  label: "Dark"   },
]

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.setAttribute("data-theme", prefersDark ? "dark" : "light")
  } else {
    root.setAttribute("data-theme", t)
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  // Hydrate from localStorage on client only
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "system"
    setTheme(saved)
    applyTheme(saved)
    setMounted(true)

    // Listen for OS theme changes when in system mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const current = (localStorage.getItem("theme") as Theme) || "system"
      if (current === "system") applyTheme("system")
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const handleSet = (t: Theme) => {
    setTheme(t)
    localStorage.setItem("theme", t)
    applyTheme(t)
  }

  // Render placeholder on server to avoid hydration mismatch
  if (!mounted) {
    return <div className="theme-pill-skeleton" aria-hidden="true" />
  }

  return (
    <div className="theme-pill" role="group" aria-label="Choose colour theme">
      {MODES.map(({ value, icon, label }) => (
        <button
          key={value}
          className={`theme-pill-btn${theme === value ? " theme-pill-active" : ""}`}
          onClick={() => handleSet(value)}
          title={label}
          aria-pressed={theme === value}
        >
          <span className="theme-pill-icon">{icon}</span>
          <span className="theme-pill-label">{label}</span>
        </button>
      ))}
    </div>
  )
}
