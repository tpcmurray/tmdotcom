import type { Metadata } from "next";
import { Cormorant_Garamond, Lora, Source_Sans_3 } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Terry Murray — AI Knowledge Hub",
  description:
    "Terry Murray logs the AI content he reads and publishes original essays about artificial intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${lora.variable} ${sourceSans.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B4513" />
        {/* RSS Auto-discovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Terry Murray — Essays (RSS)"
          href="/feed/essays"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Terry Murray — Reading Log (RSS)"
          href="/feed/log"
        />
      </head>
      <body className="flex min-h-screen justify-center">
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
        <div className="site-panel">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
