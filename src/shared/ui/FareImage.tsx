"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface FareImageProps {
  src: string
  alt: string
  routeNumber?: string
}

export default function FareImage({ src, alt, routeNumber }: FareImageProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset zoom when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.2 : 0.2
    const newScale = Math.min(Math.max(scale + delta, 1), 5)
    setScale(newScale)
    
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <>
      <div 
        style={{ 
          marginTop: 16, 
          borderRadius: 12, 
          overflow: "hidden", 
          border: "1px solid var(--border-default)",
          cursor: "zoom-in",
          transition: "transform 0.2s ease"
        }}
        className="fare-preview-card"
        onClick={() => setIsOpen(true)}
      >
        <p style={{ 
          padding: "8px 12px", 
          fontSize: "0.7rem", 
          background: "var(--bg-overlay)", 
          color: "var(--text-secondary)", 
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>📄 Official BRTA Fare Chart {routeNumber ? `for ${routeNumber}` : ""}</span>
          <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>Click to zoom</span>
        </p>
        <div style={{ position: "relative", width: "100%", height: 260, background: "#f0f0f0" }}>
          <Image 
            src={src} 
            alt={alt}
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Modal / Lightbox */}
      {isOpen && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)"
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Controls */}
          <div style={{
            position: "absolute",
            top: 20,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            padding: "0 30px",
            zIndex: 10000
          }}>
            <div style={{ color: "white" }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>{routeNumber} Fare Chart</h3>
              <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Scroll to zoom • Drag to pan</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                borderRadius: "50%",
                width: 44,
                height: 44,
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >
              ✕
            </button>
          </div>
          
          <div 
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            style={{ 
              position: "relative", 
              width: "90vw", 
              height: "80vh", 
              overflow: "hidden",
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default"
            }}
          >
            <div style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.1s ease-out"
            }}>
              <Image 
                src={src} 
                alt={alt}
                fill
                style={{ objectFit: "contain" }}
                draggable={false}
              />
            </div>
          </div>

          {/* Zoom Indicator */}
          <div style={{
            position: "absolute",
            bottom: 30,
            background: "rgba(0,0,0,0.7)",
            padding: "8px 20px",
            borderRadius: 30,
            color: "white",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: 15,
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <span style={{ fontWeight: 600 }}>Zoom: {(scale * 100).toFixed(0)}%</span>
            <button 
              onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }) }}
              style={{ background: "var(--brand-primary)", border: "none", color: "white", padding: "4px 10px", borderRadius: 4, fontSize: "0.7rem", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </>
  )
}
