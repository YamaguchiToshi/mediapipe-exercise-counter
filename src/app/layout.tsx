import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CloudflareAnalytics } from "@/components/CloudflareAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SquatAI - MediaPipe 姿勢解析スクワットカウンター",
  description: "WebカメラとMediaPipe Poseを用いた高精度スクワット回数カウンター・姿勢分析Webアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950">
        {children}
        <CloudflareAnalytics />
      </body>
    </html>
  );
}
