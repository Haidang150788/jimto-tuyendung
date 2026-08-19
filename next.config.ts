import type { NextConfig } from "next";

// `standalone` is for self-hosting via Dockerfile (it copies .next/standalone).
// Vercel builds Next.js itself and expects the default output — leaving
// standalone on there moves the trace files and breaks the deploy with
// "ENOENT: .next/next-server.js.nft.json".
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
};

export default nextConfig;
