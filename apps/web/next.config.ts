import type { NextConfig } from 'next';
import { resolve } from 'node:path';
const config: NextConfig = {
  serverExternalPackages: ['sharp'],
  poweredByHeader: false,
  webpack(config) {
    if (process.env.TRACELAB_CLOUDFLARE_BUILD === '1') {
      config.resolve.alias[
        resolve(import.meta.dirname, '../../services/api/src/next-runtime.ts')
      ] = resolve(import.meta.dirname, '../../services/api/src/cloud-proxy.ts');
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
export default config;
