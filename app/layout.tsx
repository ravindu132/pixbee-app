import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Switch to Google Font
import "./globals.css";

// Setup the font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PixBee Agency",
  description: "Manage your creative empire",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the Google Font class here */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}