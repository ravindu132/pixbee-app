import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar"; // Import the new header

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PixBee Agency",
  description: "Manage your creative empire",
  manifest: "/manifest.json",
  icons: { icon: "/logo.png", apple: "/logo.png" },
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
      <body className={`${inter.className} bg-gray-50`}>
        {/* The Header is now here, so it appears on every page automatically */}
        <NavBar /> 
        {children}
      </body>
    </html>
  );
}