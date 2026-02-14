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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen text-stone-800 antialiased ${julius.className} ${titleFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
