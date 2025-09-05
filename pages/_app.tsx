// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Sidebar from '@/components/ui/sidebar'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <Component {...pageProps} />
      </main>
    </div>
  )
}
