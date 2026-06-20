/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };
    config.externals = [...(config.externals || []), 'pino-pretty', 'encoding'];
    return config;
  },
};

export default nextConfig;
