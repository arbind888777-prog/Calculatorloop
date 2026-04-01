interface StructuredDataProps {
  title: string
  description: string
  categoryId: string
  categoryName: string
  pathname: string
  baseUrl?: string
  featureList?: string[]
  applicationCategory?: string
}

export function StructuredData({ title, description, categoryId, categoryName, pathname, baseUrl = 'https://calculatorloop.com', featureList, applicationCategory = 'UtilitiesApplication' }: StructuredDataProps) {
  const canonicalUrl = `${baseUrl}${pathname}`

  const supportedLocales = new Set([
    'hi',
    'ta',
    'te',
    'bn',
    'mr',
    'gu',
    'es',
    'pt',
    'fr',
    'de',
    'id',
    'ar',
    'ur',
    'ja',
  ])

  const segments = pathname.split('/').filter(Boolean)
  const maybeLocale = segments[0]
  const localePrefix = maybeLocale && supportedLocales.has(maybeLocale) ? `/${maybeLocale}` : ''
  const categoryUrl = `${baseUrl}${localePrefix}/category/${categoryId}`

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": title,
    "description": description,
    "url": canonicalUrl,
    "applicationCategory": applicationCategory,
    "applicationSubCategory": categoryName,
    "operatingSystem": "Any",
    "isAccessibleForFree": true,
    "image": `${baseUrl}/icon-512.png`,
    "author": {
      "@type": "Organization",
      "name": "Calculator Loop"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "featureList": featureList ?? [
      "Instant Calculation",
      "Mobile Friendly",
      "Free to Use",
      "No Registration Required"
    ]
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": categoryUrl
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": canonicalUrl
      }
    ]
  }

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": canonicalUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Calculator Loop",
      "url": baseUrl,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([softwareApplicationSchema, breadcrumbSchema, webPageSchema])
      }}
    />
  )
}
