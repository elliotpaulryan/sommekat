import type { Metadata } from "next";
import { Julius_Sans_One, Pacifico } from "next/font/google";
import "./globals.css";

const julius = Julius_Sans_One({ weight: "400", subsets: ["latin"] });
const titleFont = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-baloo" });

export const metadata: Metadata = {
  title: "SommeKat Wine Pairer",
  description:
    "Upload a restaurant menu and get AI-powered wine pairing recommendations for every dish.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
        {/* Reset zoom to 1 on every launch — iOS PWA remembers last zoom level otherwise */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function resetZoom() {
              var meta = document.querySelector('meta[name="viewport"]');
              if (meta) {
                meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                setTimeout(function() {
                  meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');
                }, 300);
              }
            }
            resetZoom();
            window.addEventListener('pageshow', resetZoom);
            window.addEventListener('focus', resetZoom);
          })();
        `}} />
      </head>
      <body className={`min-h-screen text-stone-800 antialiased ${julius.className} ${titleFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
