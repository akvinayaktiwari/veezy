import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Required for Docker production builds
  
  // Transpile shared package from monorepo
  transpilePackages: ['@veezy/shared'],
  
  // Output file tracing for standalone (moved out of experimental in Next.js 16)
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
};

export default nextConfig;
