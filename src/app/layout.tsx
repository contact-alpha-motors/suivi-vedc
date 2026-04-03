import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import AuthGuard from '@/components/layout/auth-guard';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Suivi d\'Inventaire VEDC',
  description: 'Application de suivi d\'inventaire et de ventes hors ligne.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VEDC Inventaire',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: 'https://picsum.photos/seed/vedc192/192/192',
    shortcut: 'https://picsum.photos/seed/vedc192/192/192',
    apple: 'https://picsum.photos/seed/vedc192/192/192',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <AuthGuard>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthGuard>
        </FirebaseClientProvider>
        <Toaster />
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker enregistré avec succès:', registration.scope);
                  },
                  function(err) {
                    console.log('Échec de l’enregistrement du Service Worker:', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}