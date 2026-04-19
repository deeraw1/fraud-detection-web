import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fraud Detection Engine',
  description: 'Real-time transaction fraud detection powered by XGBoost ML model',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
