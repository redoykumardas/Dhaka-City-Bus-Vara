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
  title: {
    default: "Dhaka City Bus Vara & Route Finder | ঢাকা সিটি বাস ভাড়া",
    template: "%s | Dhaka Bus Vara"
  },
  description:
    "Check Dhaka city bus fares (BRTA 2024), find routes, compare operators, and estimate travel times. The most accurate Dhaka bus route finder.",
  keywords: [
    "Dhaka bus fare", 
    "Dhaka bus route finder", 
    "ঢাকা বাস ভাড়া", 
    "BRTA fare chart 2024", 
    "bus fare Bangladesh",
    "Dhaka city bus service",
    "bus route and fare calculator"
  ],
  authors: [{ name: "Redoy Kumar Das" }],
  creator: "Redoy Kumar Das",
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "https://dhaka-city-bus-vara.vercel.app",
    title: "Dhaka City Bus Vara & Route Finder",
    description: "Accurate Dhaka bus fares and route finding for 200+ bus services.",
    siteName: "Dhaka Bus Vara",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhaka City Bus Vara & Route Finder",
    description: "Accurate Dhaka bus fares and route finding for 200+ bus services.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Dhaka City Bus Vara",
              "operatingSystem": "All",
              "applicationCategory": "TravelApplication",
              "description": "Accurate Dhaka bus fares (BRTA 2024) and route finding for 200+ bus services.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BDT"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1024"
              }
            })
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div className="page-bg" />
        <header className="navbar container">
          <div className="navbar-inner">
            <div className="logo">
              <div className="logo-icon">🚌</div>
              <span>
                Dhaka <span style={{ color: "var(--brand-primary)" }}>Bus</span>
              </span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
