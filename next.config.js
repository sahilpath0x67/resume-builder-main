/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,

  // Compress HTTP responses (gzip/brotli) — free perf win
  compress: true,

  // Optimise images served via next/image
  images: {
    formats: ['image/avif', 'image/webp'],
    // Add any external domains you load images from here:
    // remotePatterns: [
    //   { protocol: 'https', hostname: 'lh3.googleusercontent.com' },  // Google avatars
    // ],
  },

  // Strict Content Security Policy headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options',        value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          // Only send referrer on same origin
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          // Control browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;