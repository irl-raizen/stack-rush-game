import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { PwaRegister } from "@/components/stack-game/pwa-register"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Stack Rush: Perfect Tower",
  description:
    "Tap to drop blocks, stack them perfectly and build the tallest tower. A mobile-first arcade PWA.",
  applicationName: "Stack Rush",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Stack Rush",
  },
  generator: "v0.app",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased overscroll-none">
        {children}
        <PwaRegister />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
