import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { SentryProvider } from "@/components/providers/sentry-provider";
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
  metadataBase: new URL("https://lynxprompt.com"),
  title: {
    default: "LynxPrompt - AI IDE Configuration Generator",
    template: "%s | LynxPrompt",
  },
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
    "AI coding",
    "IDE rules",
    "AGENTS.md",
    "cursorrules",
  ],
  authors: [{ name: "GeiserCloud", url: "https://geiser.cloud" }],
  creator: "GeiserCloud",
  publisher: "LynxPrompt",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
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
      "AI IDE/Tools rule config generator via WebUI or CLI. Generate, browse, store & share AGENTS.md, CLAUDE.md, and more.",
    type: "website",
    siteName: "LynxPrompt",
    locale: "en_US",
    url: "https://lynxprompt.com",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 640,
        alt: "LynxPrompt - AI IDE/Tools rule config generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LynxPrompt - AI IDE Configuration Generator",
    description:
      "AI IDE/Tools rule config generator via WebUI or CLI. Generate, browse, store & share AGENTS.md, CLAUDE.md, and more.",
    images: ["/og-image.png"],
    creator: "@geaboron",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://lynxprompt.com",
    types: {
      "application/rss+xml": "/api/blog/rss",
    },
  },
  verification: {
    // Add verification codes when available
    // google: "your-google-verification-code",
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
        {/* Umami Analytics - privacy-focused, cookieless */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://umami.lynxprompt.com/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-do-not-track="false"
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
            <SentryProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </SentryProvider>
            <Toaster />
            <CookieBanner />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
