import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Alatsi } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });
const alatsi = Alatsi({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AuraSutra - Doctor Portal',
  description: 'Professional portal for Ayurvedic healthcare practitioners',
  keywords: ['ayurveda', 'doctor', 'healthcare', 'telemedicine', 'practitioner'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1F2937',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
