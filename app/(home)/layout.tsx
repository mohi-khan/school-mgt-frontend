import { Toaster } from '@/components/ui/toaster'
import '.././globals.css'
import { Inter } from 'next/font/google'
import { ReactQueryProvider } from '@/provider/ReactQueryProvider'

const inter = Inter({ subsets: ['latin'] })

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <div className="">
            <div className="bg-white rounded">{children}</div>
            <Toaster />
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
