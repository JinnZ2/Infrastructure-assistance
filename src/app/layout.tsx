/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import type {Metadata} from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'InfraGuard',
  description: 'Real-time infrastructure alert monitoring for the Upper Midwest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
