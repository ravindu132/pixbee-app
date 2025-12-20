import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Tells Next.js to create static files for the app
  images: {
    unoptimized: true, // Required for mobile apps to show images
  },
};

export default nextConfig;