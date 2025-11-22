/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // Allow production builds with ESLint warnings (not errors)
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Allow production builds with TypeScript warnings (not errors)
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Fix for webpack chunk resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Suppress pino-pretty errors (it's an optional dev dependency from walletconnect)
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };

    // Make pino-pretty optional - if it fails to resolve, just ignore it
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };

    // Suppress web-worker warnings (these are expected for snarkjs)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/web-worker/,
      },
      {
        module: /node_modules\/ffjavascript/,
      },
      {
        module: /node_modules\/snarkjs/,
      },
    ];

    return config;
  },
}

module.exports = nextConfig

