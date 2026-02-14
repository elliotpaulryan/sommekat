import type { Metadata } from "next";
import { Julius_Sans_One, Pacifico } from "next/font/google";
import "./globals.css";

const julius = Julius_Sans_One({ weight: "400", subsets: ["latin"] });
const titleFont = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-baloo" });

export const metadata: Metadata = {
  title: "SommeKat — AI Menu & Wine Pairing",
  description:
    "Upload a restaurant menu and get AI-powered wine pairing recommendations for every dish.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SommeKat" />
        <meta name="theme-color" content="#4a1e24" />
      </head>
      <body className={`min-h-screen text-stone-800 antialiased ${julius.className} ${titleFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
