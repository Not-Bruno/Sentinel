
import './globals.css';
import React from 'react';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { MainNav } from '@/components/layout/main-nav';

// Importiert die zentrale Registry auf der obersten Server-Ebene, um sicherzustellen,
// dass alle Server-Aktionen vom Next.js-Build-Prozess erfasst werden.
// Dies ist der entscheidende Fix für "Failed to find Server Action"-Fehler.
import '@/ai/genkit-registry';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>Sentinel</title>
        <meta name="description" content="Real-time monitoring for your infrastructure." />
      </head>
      <body className="font-body antialiased">
        <Providers>
            <div className="flex flex-col min-h-screen bg-background">
              <Header>
                <MainNav />
              </Header>
              <main className="flex-1">{children}</main>
            </div>
        </Providers>
      </body>
    </html>
  );
}
