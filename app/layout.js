import './globals.css'

export const metadata = {
  title: 'FilamentVault - 3D Printing Inventory',
  description: 'Track your 3D printing filament inventory with NFC reader/writer support',
  openGraph: {
    title: 'FilamentVault',
    description: 'Track your 3D printing filament inventory',
    type: 'website'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: true,
  themeColor: '#1e293b'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FilamentVault" />
      </head>
      <body className="bg-slate-900">
        {children}
      </body>
    </html>
  )
}
