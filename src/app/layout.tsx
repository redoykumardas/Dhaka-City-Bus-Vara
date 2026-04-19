import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Dhaka City Bus Finder | ঢাকা বাস রুট ফাইন্ডার",
  description:
    "Find the best bus routes across Dhaka city. Compare fares, travel times and transfers for 200+ bus operators.",
  keywords: "Dhaka bus, bus route finder, ঢাকা বাস, BRTA fare, bus fare Bangladesh",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
