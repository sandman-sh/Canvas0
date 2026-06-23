import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Canvas0 | Real-Time Multiplayer AI Asset Canvas',
  description: 'Enterprise-grade real-time multiplayer collaborative canvas for AI text & graphic assets. Authenticated and provenance-tracked on the 0G Chain.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full bg-white text-black flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
