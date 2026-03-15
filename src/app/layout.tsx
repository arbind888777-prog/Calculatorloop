import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { CloudSyncBootstrap } from '@/components/providers/CloudSyncBootstrap'
import { SettingsProvider } from '@/components/providers/SettingsProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DeferredClientBits } from '@/components/layout/DeferredClientBits'
import { OrganizationSchema, WebsiteSchema } from '@/components/seo/AdvancedSchema'
import { ServiceWorkerRegistration } from '@/lib/serviceWorker'
import ToastProvider from '@/components/providers/ToastProvider'
import AnalyticsProvider from '@/components/providers/AnalyticsProvider'
import { fontClassNames } from '@/lib/fonts'
import { getSiteUrl } from '@/lib/siteUrl'
import './globals.css'

const SUPPORTED_LOCALES = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'es', 'pt', 'fr', 'de', 'id', 'ar', 'ur', 'ja'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES)

const getCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

const detectLocaleFromPath = (pathname: string): SupportedLocale | null => {
  const m = pathname.match(/^\/([a-z]{2})(?:\/|$)/i)
  const maybe = m?.[1]?.toLowerCase()
  if (!maybe) return null
  return (SUPPORTED_LOCALE_SET.has(maybe) ? (maybe as SupportedLocale) : null)
}

const stripLocalePrefix = (pathname: string): string => {
  const loc = detectLocaleFromPath(pathname)
  if (!loc || loc === 'en') return pathname
  const prefix = `/${loc}`
  const stripped = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname
  return stripped.length ? stripped : '/'
}

const getUiLocaleFromRequest = async (): Promise<SupportedLocale> => {
  const h = await headers()
  const headerLocale = h.get('x-calculator-language')?.toLowerCase() ?? null
  if (headerLocale && SUPPORTED_LOCALE_SET.has(headerLocale)) return headerLocale as SupportedLocale

  const cookieLocale = getCookie(h.get('cookie'), 'calculator-language')?.toLowerCase() ?? null
  if (cookieLocale && SUPPORTED_LOCALE_SET.has(cookieLocale)) return cookieLocale as SupportedLocale

  return 'en'
}

const buildAlternates = async () => {
  const h = await headers()
  const baseUrl = getSiteUrl()
  const originalPathname = h.get('x-original-pathname') ?? '/'
  const basePathNoLocale = stripLocalePrefix(originalPathname)

  const languages: Record<string, string> = {}
  for (const loc of SUPPORTED_LOCALES) {
    const localizedPath =
      loc === 'en'
        ? basePathNoLocale
        : `/${loc}${basePathNoLocale === '/' ? '' : basePathNoLocale}`
    languages[loc] = `${baseUrl}${localizedPath}`
  }

  languages['x-default'] = languages.en

  const uiLocale = await getUiLocaleFromRequest()
  const canonical =
    uiLocale === 'en'
      ? `${baseUrl}${basePathNoLocale}`
      : `${baseUrl}/${uiLocale}${basePathNoLocale === '/' ? '' : basePathNoLocale}`

  return { canonical, languages }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00D4FF' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0E27' },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getSiteUrl()
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION
  const twitterHandle = process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? '@calculatorloop'
  const uiLocale = await getUiLocaleFromRequest()
  const { canonical, languages } = await buildAlternates()

  const ogLocaleMap: Record<string, string> = {
    en: 'en_US',
    hi: 'hi_IN',
    mr: 'mr_IN',
    ta: 'ta_IN',
    te: 'te_IN',
    bn: 'bn_IN',
    gu: 'gu_IN',
    es: 'es_ES',
    pt: 'pt_BR',
    fr: 'fr_FR',
    de: 'de_DE',
    id: 'id_ID',
    ar: 'ar_SA',
    ur: 'ur_PK',
    ja: 'ja_JP',
  }
  const ogLocale = ogLocaleMap[uiLocale] ?? 'en_US'

  return {
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical,
      languages,
    },
    title: {
      default: 'Calculator Loop - Free Online Calculators | EMI, SIP, BMI, GST, Age & Tax Calculator',
      template: '%s | Calculator Loop',
    },
    description:
      'Free online calculator tools for 2026! Calculate EMI, SIP returns, BMI, GST, income tax, loan payments, retirement planning & more. Fast, accurate & mobile-friendly calculators. No signup required.',
    keywords: [
      'online calculator',
      'free calculator 2026',
      'EMI calculator India',
      'SIP calculator',
      'GST calculator India',
      'BMI calculator',
      'age calculator',
      'percentage calculator',
      'loan calculator',
      'home loan EMI',
      'investment calculator',
      'income tax calculator 2026',
    ],
    authors: [{ name: 'Calculator Loop' }],
    creator: 'Calculator Loop',
    publisher: 'Calculator Loop',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      url: baseUrl,
      siteName: 'Calculator Loop',
      title: 'Calculator Loop - Free Online Calculators | EMI, SIP, BMI, Tax Calculator',
      description:
        'Free online calculators for 2026! Calculate EMI, SIP returns, BMI, GST, income tax & more. Fast, accurate & mobile-friendly. Extensive calculator tools available.',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Calculator Loop - Free Online Calculators',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: twitterHandle,
      creator: twitterHandle,
      title: 'Calculator Loop - Free Online Calculators | EMI, SIP, BMI, Tax',
      description:
        'Free online calculators for 2026! Calculate EMI, SIP returns, BMI, GST, income tax & more. Fast, accurate & mobile-friendly. Extensive tools available.',
      images: ['/twitter-image'],
    },
    verification: googleVerification || yandexVerification ? {
      ...(googleVerification ? { google: googleVerification } : {}),
      ...(yandexVerification ? { yandex: yandexVerification } : {}),
    } : undefined,
    icons: {
      icon: [
        { url: '/favicon.ico', type: 'image/x-icon' },
        { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
        { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
        { url: '/favicon-48.png', type: 'image/png', sizes: '48x48' },
        { url: '/logo.svg', type: 'image/svg+xml' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
        { url: '/logo.svg', type: 'image/svg+xml' },
      ],
    },
    manifest: '/manifest.json',
  }
}

// Add cache control
export const revalidate = 3600 // Cache for 1 hour

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const uiLocale = await getUiLocaleFromRequest()
  return (
    <html lang={uiLocale} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className={`min-h-screen antialiased ${fontClassNames}`}>
        <ServiceWorkerRegistration />
        <AuthProvider>
          <SettingsProvider>
            <CloudSyncBootstrap />
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AnalyticsProvider>
                <ToastProvider />
                <div className="relative flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1 pt-20">{children}</main>
                  <Footer />
                  <DeferredClientBits />
                </div>
              </AnalyticsProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
