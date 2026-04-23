"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface SearchBarProps {
  allStops: string[]
  defaultFrom?: string
  defaultTo?: string
}

export default function SearchBar({ allStops, defaultFrom = "", defaultTo = "" }: SearchBarProps) {
  const router = useRouter()
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([])
  const [toSuggestions, setToSuggestions] = useState<string[]>([])
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)

  const POPULAR_STOPS = ["Mirpur 10", "Motijheel", "Farmgate", "Uttara", "Gabtoli", "Gulistan", "Mohakhali", "Sayedabad"]

  const getSuggestions = (query: string) => {
    if (!query || query.length < 1) return POPULAR_STOPS
    const q = query.toLowerCase()
    return allStops
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 10)
  }

  const handleFromChange = (v: string) => {
    setFrom(v)
    setFromSuggestions(getSuggestions(v))
    setFromOpen(true)
  }

  const handleToChange = (v: string) => {
    setTo(v)
    setToSuggestions(getSuggestions(v))
    setToOpen(true)
  }

  const handleSwap = () => {
    const temp = from
    setFrom(to)
    setTo(temp)
  }

  const handleSearch = () => {
    if (!from || !to) return
    router.push(`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setFromOpen(false)
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setToOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [])

  return (
    <div className="search-grid">
      {/* From Input */}
      <div className="form-group" ref={fromRef}>
        <label className="label">Origin Stop</label>
        <div className="input-container">
          <span className="input-icon-main">⭕</span>
          <input
            className="input"
            type="text"
            placeholder="Starting from..."
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            onFocus={() => {
              setFromSuggestions(getSuggestions(from))
              setFromOpen(true)
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {fromOpen && fromSuggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {fromSuggestions.map((s) => (
                <div
                  key={s}
                  className="autocomplete-item"
                  onMouseDown={() => {
                    setFrom(s)
                    setFromOpen(false)
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swap Button for Desktop (Inline) */}
      <button 
        className="icon-btn hide-mobile" 
        onClick={handleSwap} 
        style={{ marginBottom: 4, borderRadius: "50%" }}
        title="Swap Destinations"
      >
        🔄
      </button>

      {/* To Input */}
      <div className="form-group" ref={toRef}>
        <label className="label">Destination</label>
        <div className="input-container">
          <span className="input-icon-main">📍</span>
          <input
            className="input"
            type="text"
            placeholder="Going to..."
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            onFocus={() => {
              setToSuggestions(getSuggestions(to))
              setToOpen(true)
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {toOpen && toSuggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {toSuggestions.map((s) => (
                <div
                  key={s}
                  className="autocomplete-item"
                  onMouseDown={() => {
                    setTo(s)
                    setToOpen(false)
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Button */}
      <button 
        className="btn btn-primary" 
        onClick={handleSearch} 
        disabled={!from || !to}
        style={{ height: 48, width: "100%", maxWidth: 200 }}
      >
        Find Routes
      </button>
    </div>
  )
}
