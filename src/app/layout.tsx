import type {Metadata} from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { MainNav } from '@/components/layout/main-nav';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'Sentinel',
  description: 'Real-time monitoring for your infrastructure.',
};

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
