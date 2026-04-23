import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeToggle } from "@/shared/ui/ThemeToggle"

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme') || 'system';
                  const root = document.documentElement;
                  if (savedTheme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.setAttribute('data-theme', systemTheme);
                  } else {
                    root.setAttribute('data-theme', savedTheme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div className="page-bg" />
        <header className="navbar container">
          <div className="navbar-inner">
            <div className="logo">
              <div className="logo-icon">🚌</div>
              <span>Bus Finder</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
