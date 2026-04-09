import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@initia/interwovenkit-react"],
  turbopack: {
    resolveAlias: {
      "@initia/interwovenkit-react": "@initia/interwovenkit-react/dist/index.js",
      "@initia/interwovenkit-react/styles.js": "@initia/interwovenkit-react/dist/styles.js",
    },
  },
};

export default nextConfig;
