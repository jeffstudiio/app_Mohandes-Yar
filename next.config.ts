import type { NextConfig } from "next";

// Static-export mode (GitHub Pages demo): STATIC_EXPORT=1 + NEXT_PUBLIC_BASE_PATH=/app_Mohandes-Yar
// Server mode (default): standalone output with /api/mhy/* route handlers.
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(isStatic
    ? {
        output: "export" as const,
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
        distDir: ".next-static", // never clobber the dev server's .next
      }
    : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
