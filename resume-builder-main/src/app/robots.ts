import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE = (process.env.NEXT_PUBLIC_URL || 'https://nepastra.com').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/payment-success'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
