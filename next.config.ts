import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so a stray lockfile outside this repo is not
    // misdetected as the project root (see build warning about ~/yarn.lock).
    root: process.cwd(),
  },
};

export default nextConfig;
