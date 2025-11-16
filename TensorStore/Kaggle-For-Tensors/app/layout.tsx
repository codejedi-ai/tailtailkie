import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { LayoutWrapper } from '@/components/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TensorStore - Pure ML Dataset Platform',
  description: 'Upload and share structured tensor datasets for machine learning. The home of Kaggle for Tensors.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
