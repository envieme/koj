/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: "all",
      maxSize: 24000000, // Ensure chunks stay below Cloudflare’s 25MB limit
      minSize: 10000, // Avoid excessively small chunks
    };

    config.optimization.runtimeChunk = "single"; // Optimize caching
    return config;
  },
};

export default nextConfig;
