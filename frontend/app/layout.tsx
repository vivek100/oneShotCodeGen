import type React from "react"
import { Inter, Poppins } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Sidebar from "@/components/sidebar"
import { AuthProvider } from "@/contexts/AuthContext"
import MixpanelProvider from "@/components/mixpanel-provider"
import "./globals.css"

// Use Poppins for headings
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

// Use Inter for body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <MixpanelProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">{children}</main>
              </div>
            </MixpanelProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
