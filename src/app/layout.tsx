import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Winnerbet — Sports Betting & Casino",
    template: "%s | Winnerbet",
  },
  description:
    "Bet on live football and play instant casino games on Winnerbet. Fast deposits, instant payouts.",
  applicationName: "Winnerbet",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-wb-bg font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}