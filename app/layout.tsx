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

// Force dynamic rendering to avoid Clerk key issues during build
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get Clerk publishable key
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  // If no key during build, render without ClerkProvider to avoid build errors
  // The key should be set in Vercel environment variables
  const content = (
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
  )
  
  if (!publishableKey) {
    // During build without key, render without ClerkProvider
    return content
  }
  
  return (
    <ClerkProvider publishableKey={publishableKey}>
      {content}
    </ClerkProvider>
  )
}
