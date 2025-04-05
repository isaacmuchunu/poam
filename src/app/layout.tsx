import { TenantProvider } from '@/contexts/tenant-context';
import { AuthProvider } from '@/contexts/auth-context';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'POA&M Architect',
  description: 'A multi-tenant SaaS system for POA&M management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          <TenantProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TenantProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
