/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 15
  experimental: {
    // Other experimental features can go here
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        buffer: 'buffer',
        util: 'util',
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        events: 'events',
        url: 'url',
        querystring: 'querystring-es3',
        http: false,
        https: false,
      };
    }

    // Handle server-side crypto issues
    if (isServer) {
      config.externals = [...(config.externals || []), 'crypto'];
    }

    return config;
  },
  // Add rewrites for Hedera API proxy
  async rewrites() {
    return [
      {
        source: '/api/hedera/:path*',
        destination: 'https://testnet.mirrornode.hedera.com/api/:path*',
      },
    ];
  },
  // Disable service workers that might interfere with wallet modals
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
