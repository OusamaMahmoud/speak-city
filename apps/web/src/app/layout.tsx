import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Speak City", description: "Learn the 5000 most useful English words by walking into 3D scenes and talking to people." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#14162B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
