import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { FeatureFlagsProvider } from "@/components/providers/feature-flags-provider";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/cookie-banner";
import { APP_NAME, APP_URL, UMAMI_SCRIPT_URL, getPublicFlags } from "@/lib/feature-flags";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export function generateMetadata(): Metadata {
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: `${APP_NAME} - AI IDE Configuration Generator`,
      template: `%s | ${APP_NAME}`,
    },
    description:
      "Open-source platform to generate, store, and sync AI IDE configurations. Create .cursorrules, CLAUDE.md, AGENTS.md and more — self-hostable and federated.",
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
      "open-source",
      "self-hosted",
      "blueprint",
    ],
    authors: [{ name: "GeiserCloud", url: "https://geiser.cloud" }],
    creator: "GeiserCloud",
    publisher: APP_NAME,
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
      title: APP_NAME,
    },
    openGraph: {
      title: `${APP_NAME} — AI Rule/Configuration Files Hub`,
      description:
        "AI IDE/Tools rule config generator via WebUI or CLI. Generate, browse, store & share AGENTS.md, CLAUDE.md, and more.",
      type: "website",
      siteName: APP_NAME,
      locale: "en_US",
      url: appUrl,
      images: [
        {
          url: "/og-image.png",
          width: 1280,
          height: 640,
          alt: `${APP_NAME} - AI IDE/Tools rule config generator`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${APP_NAME} — AI Rule/Configuration Files Hub`,
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
      canonical: appUrl,
      types: {
        "application/rss+xml": "/api/blog/rss",
      },
    },
    verification: {
      // Add verification codes when available
      // google: "your-google-verification-code",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://avatars.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: [
              "(function(){",
              "var h=document.head,b={};",
              "new MutationObserver(function(ml){ml.forEach(function(m){",
              "m.addedNodes.forEach(function(n){if(n.nodeName==='LINK'&&n.rel==='stylesheet'&&n.dataset&&n.dataset.precedence&&!b[n.href]){b[n.href]=1;var c=document.createElement('link');c.rel='stylesheet';c.href=n.href;h.appendChild(c)}});",
              "m.removedNodes.forEach(function(n){if(n.nodeName==='LINK'&&n.rel==='stylesheet'&&n.dataset&&n.dataset.precedence&&!b[n.href]){b[n.href]=1;var c=document.createElement('link');c.rel='stylesheet';c.href=n.href;h.appendChild(c)}});",
              "})}).observe(h,{childList:true});",
              "h.querySelectorAll('link[rel=stylesheet][data-precedence]').forEach(function(l){if(!b[l.href]){b[l.href]=1;var c=document.createElement('link');c.rel='stylesheet';c.href=l.href;h.appendChild(c)}});",
              "})()",
            ].join(""),
          }}
        />
        {/* Umami Analytics - only when explicitly configured */}
        {UMAMI_SCRIPT_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src={UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-do-not-track="false"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <FeatureFlagsProvider initialFlags={getPublicFlags()}>
              {children}
            </FeatureFlagsProvider>
            <Toaster />
            <CookieBanner />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
