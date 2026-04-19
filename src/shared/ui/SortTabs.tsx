"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SortKey } from "@/domain/types"

interface SortTabsProps {
  current: SortKey
  from: string
  to: string
}

const tabs: { key: SortKey; label: string; emoji: string }[] = [
  { key: "fare", label: "Cheapest", emoji: "💰" },
  { key: "time", label: "Fastest", emoji: "⏱" },
  { key: "transfers", label: "Direct", emoji: "🔄" },
]

export default function SortTabs({ current, from, to }: SortTabsProps) {
  const router = useRouter()

  const handleSort = (key: SortKey) => {
    router.push(`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&sort=${key}`)
  }

  return (
    <div className="sort-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          id={`sort-${tab.key}`}
          onClick={() => handleSort(tab.key)}
          className={`btn btn-ghost btn-sm ${current === tab.key ? "active" : ""}`}
        >
          {tab.emoji} {tab.label}
        </button>
      ))}
    </div>
  )
}
