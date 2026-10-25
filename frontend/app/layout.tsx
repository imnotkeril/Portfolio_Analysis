import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeaderClient } from "@/components/AppHeaderClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio Analyzer | Wild Market",
  description:
    "Professional portfolio analytics, optimization, and risk tools — Wild Market style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased pt-14`}
      >
        <AppHeaderClient />
        {children}
      </body>
    </html>
  );
}
