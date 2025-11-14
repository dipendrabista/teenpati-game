import type { Metadata } from 'next';
import { APP_TITLE } from '@/lib/appConfig';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';
import SessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_TITLE,
  description: 'Play Teen Patti online with friends in real-time | आफ्ना साथीहरूसँग अनलाइन टिन पत्ति खेल्नुहोस्',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LanguageProvider>
              {children}
              <Toaster 
                position="top-right" 
                richColors 
                expand={true}
                closeButton
                duration={3000}
                toastOptions={{
                  style: {
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                  },
                  className: 'game-toast',
                }}
              />
            </LanguageProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

