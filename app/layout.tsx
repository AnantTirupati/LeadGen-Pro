import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadGen Pro — AI-Powered Lead Generation Platform',
  description:
    'LeadGen Pro is the AI-powered lead generation platform that helps freelancers, agencies, and developers find, qualify, and convert leads 10x faster.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.fontshare.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
