import type { NextConfig } from "next";

// `standalone` is for self-hosting via Dockerfile (it copies .next/standalone).
// Vercel builds Next.js itself and expects the default output — leaving
// standalone on there moves the trace files and breaks the deploy with
// "ENOENT: .next/next-server.js.nft.json".
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // pdf-parse pulls in pdfjs-dist, which tries to load a worker file by a
  // relative path at runtime — bundling it rewrites that path into a
  // Turbopack chunk that doesn't exist, breaking CV email extraction
  // (/api/apply). Keeping it external makes Node require() it normally.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
