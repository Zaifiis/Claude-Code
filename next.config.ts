import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module — keep it out of the bundler so it loads
  // via Node's require at runtime on the server.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
