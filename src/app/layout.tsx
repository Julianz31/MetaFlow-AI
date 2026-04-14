import { Metadata, Viewport } from 'next'
import './globals.css'
import NavigationWrapper from '@/components/layout/NavigationWrapper'

export const metadata: Metadata = {
  title: 'VAULT. | Libertad Financiera',
  description: 'Tu bóveda personal de inversiones y metas financieras.',
  manifest: '/manifest.json'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#0b0c10] text-white min-h-screen flex m-0 font-sans overflow-x-hidden">
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  )
}