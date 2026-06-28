import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@cwr/sdk"],
  turbopack: { root: path.resolve(import.meta.dirname, "../..") },
};

export default nextConfig;
