import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aplikasi admin yang sepenuhnya dinamis (auth + DB). Cache Components
  // tidak dipakai agar route tidak dipaksa prerender.
  cacheComponents: false,
  output: "standalone",
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
