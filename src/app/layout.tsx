import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LynxPrompt - AI IDE Configuration Generator",
  description:
    "Transform your development setup into a mouse-click experience. Generate .cursorrules, CLAUDE.md, and more with smart conditional logic.",
  keywords: [
    "AI IDE",
    "Cursor",
    "Claude",
    "Copilot",
    "Windsurf",
    "configuration",
    "prompt",
    "developer tools",
  ],
  authors: [{ name: "LynxPrompt Contributors" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LynxPrompt",
  },
  openGraph: {
    title: "LynxPrompt - AI IDE Configuration Generator",
    description:
      "Transform your development setup into a mouse-click experience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Umami Analytics - respects DNT, privacy-focused */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://umami.geiser.cloud/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AnalyticsProvider>{children}</AnalyticsProvider>
            <Toaster />
            <CookieBanner />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
