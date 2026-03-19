import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { CustomCursor } from "@/components/shared/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alexander Wolf Pedersen",
  description: "Dive into my brain.",
  openGraph: {
    title: "Alexander Wolf Pedersen",
    description: "Dive into my brain.",
    type: "website",
    images: [
      {
        url: "/frames/frame-001.jpg",
        width: 1284,
        height: 716,
        alt: "Alexander Wolf Pedersen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alexander Wolf Pedersen",
    description: "Dive into my brain.",
    images: ["/frames/frame-001.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SmoothScroll>
          <CustomCursor />
          <div className="noise-overlay">{children}</div>
        </SmoothScroll>
      </body>
    </html>
  );
}
