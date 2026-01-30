import type { Metadata } from 'next';
// Temporarily commented out due to network connectivity issues during build
// import { Inter } from 'next/font/google';
// import { Alatsi } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';

// Using system fonts as fallback
// const inter = Inter({ subsets: ['latin'] });
// const alatsi = Alatsi({ weight: '400', subsets: ['latin'] });

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
        {/* Google Fonts temporarily disabled due to network issues */}
      </head>
      <body className="font-sans">
        <LanguageProvider>
          {children}
        </LanguageProvider>
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
