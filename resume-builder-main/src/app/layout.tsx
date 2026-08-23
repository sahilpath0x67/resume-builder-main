import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const SITE_URL = (process.env.NEXT_PUBLIC_URL || 'https://nepastra.com').replace(/\/+$/, '');
const SITE_NAME = 'NepAstra';
const SITE_TITLE = 'NepAstra Resume Builder - AI CV Maker';
const SITE_DESCRIPTION =
  'Build polished, ATS-friendly resumes with NepAstra. Use AI writing, recruiter-ready templates, cover letters, LinkedIn summaries, and resume scoring.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: 'productivity',
  keywords: [
    'free resume builder',
    'AI resume builder',
    'ATS resume builder',
    'CV builder',
    'cover letter generator',
    'LinkedIn summary generator',
    'resume templates',
    'resume builder Nepal',
    'NepAstra',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/nepastra-logo.jpeg',
        width: 1600,
        height: 900,
        type: 'image/jpeg',
        alt: 'NepAstra Technology Pvt. Ltd. logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/nepastra-logo.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/nepastra-logo.jpeg', sizes: '1600x900', type: 'image/jpeg' },
    ],
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1D4ED8' },
    { media: '(prefers-color-scheme: dark)', color: '#172554' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'AI resume writing',
      'ATS score analysis',
      'Cover letter generation',
      'LinkedIn summary writing',
      'PDF, DOCX, HTML, and backup exports',
      'Responsive resume editing and preview',
    ],
  };

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <a className="skip-to-main" href="#main-content">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
