// app/layout.tsx - ROOT LAYOUT
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import RefreshOnNavigation from "./components/RefreshOnNavigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Joy Juncture",
  description: "Board Game Experience Platform",
  icons: {
    icon: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png",
    shortcut: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png",
    apple: "https://res.cloudinary.com/dwvb2cgmq/image/upload/v1767973882/50a5ca49-d3e1-4441-89dd-4cfd1177c9b5.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <RefreshOnNavigation />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
