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

  const getSuggestions = (query: string) => {
    if (!query || query.length < 1) return []
    const q = query.toLowerCase()
    return allStops
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 8)
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
    setFrom(to)
    setTo(from)
  }

  const handleSearch = () => {
    if (!from || !to) return
    router.push(`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setFromOpen(false)
      if (toRef.current && !toRef.current.contains(e.target as Node)) setToOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="search-bar">
      <div className="search-fields">
        {/* FROM */}
        <div className="input-wrapper" ref={fromRef}>
          <span className="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.6"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </span>
          <input
            id="search-from"
            className="input"
            type="text"
            placeholder="From (e.g. Mirpur 10)"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            onFocus={() => { setFromSuggestions(getSuggestions(from)); setFromOpen(true) }}
            autoComplete="off"
          />
          {fromOpen && fromSuggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {fromSuggestions.map((s) => (
                <div
                  key={s}
                  className="autocomplete-item"
                  onMouseDown={() => { setFrom(s); setFromOpen(false); setFromSuggestions([]) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4"/>
                  </svg>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SWAP BUTTON */}
        <button
          id="swap-btn"
          onClick={handleSwap}
          className="swap-btn"
          title="Swap stops"
          aria-label="Swap from and to"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 3L4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>
          </svg>
        </button>

        {/* TO */}
        <div className="input-wrapper" ref={toRef}>
          <span className="input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.5"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          </span>
          <input
            id="search-to"
            className="input"
            type="text"
            placeholder="To (e.g. Motijheel)"
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            onFocus={() => { setToSuggestions(getSuggestions(to)); setToOpen(true) }}
            autoComplete="off"
          />
          {toOpen && toSuggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {toSuggestions.map((s) => (
                <div
                  key={s}
                  className="autocomplete-item"
                  onMouseDown={() => { setTo(s); setToOpen(false); setToSuggestions([]) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        id="search-btn"
        className="btn btn-primary search-btn"
        onClick={handleSearch}
        disabled={!from || !to}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        Find Routes
      </button>
    </div>
  )
}
