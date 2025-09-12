import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fênix PDF - Editor de PDF Profissional',
  description: 'Aplicação web moderna projetada para centralizar e simplificar a manipulação de arquivos PDF',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fênix PDF',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Fênix PDF',
    title: 'Fênix PDF - Editor de PDF Profissional',
    description: 'Aplicação web moderna para manipulação de arquivos PDF',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fênix PDF - Editor de PDF Profissional',
    description: 'Aplicação web moderna para manipulação de arquivos PDF',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}