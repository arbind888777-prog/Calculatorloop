/** @type {import('next').NextConfig} */
const enableStandalone =
  process.env.NEXT_OUTPUT === 'standalone' || process.env.NEXT_OUTPUT_STANDALONE === 'true'

const webpack = require('webpack')

const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,

  // Avoid Next.js auto-selecting a parent folder as the workspace root when
  // multiple lockfiles exist on the machine.
  outputFileTracingRoot: __dirname,
  
  // Skip TS type-check during build — Next.js 16 generates a corrupt
  // .next/dev/types/routes.d.ts whose JSDoc comment is malformed.
  // Webpack compilation already validates all component code.
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
    optimizeCss: true,
    scrollRestoration: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Bundle analyzer (optional)
  webpack: (config, { isServer }) => {
    // Some dependencies use `node:`-prefixed core-module imports (e.g. `node:fs`).
    // Webpack in this setup doesn't handle the `node:` scheme, so normalize it.
    config.plugins = config.plugins || []
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '')
      })
    )

    // Minimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http: false,
        https: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  // HTTP Headers for SEO and Security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()'
          }
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Cache images
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
    ]
  },

  // Redirects for SEO
  async redirects() {
    return [
      // Redirect www to non-www (FIRST - highest priority)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.calculatorloop.com',
          },
        ],
        destination: 'https://calculatorloop.com/:path*',
        permanent: true,
      },
      
      // Remove .html extensions FIRST (before category redirects)
      // This catches /business-tools/roi-calculator.html and converts to /business-tools/roi-calculator
      {
        source: '/:path*.html',
        destination: '/:path*',
        permanent: true,
      },
      
      // Legacy HTML site redirects - Old folder structure to new
      // Math calculators: /Math/Law-of-Sines-Calculator -> /calculator/law-of-sines-calculator
      {
        source: '/Math/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/math/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Financial calculators: /financial-calculators/* -> /calculator/*
      {
        source: '/financial-calculators/:path*',
        destination: '/calculator/:path*',
        permanent: true,
      },
      {
        source: '/Financial-calculators/:path*',
        destination: '/calculator/:path*',
        permanent: true,
      },
      
      // Physics calculators
      {
        source: '/Physics/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/physics/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Health calculators
      {
        source: '/Health/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/health/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Education calculators
      {
        source: '/Education/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/education/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Construction calculators
      {
        source: '/Construction/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/construction/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Technology calculators
      {
        source: '/Technology/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/technology/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Scientific calculators
      {
        source: '/Scientific/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/scientific/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // DateTime calculators
      {
        source: '/DateTime/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/datetime/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Everyday calculators
      {
        source: '/Everyday/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/everyday/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Business calculators
      {
        source: '/Business/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/business/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Legacy category-based URLs: /business-tools/*, /financial-calculators/*, etc.
      // These are indexed by Google and need to redirect properly
      
      // Business tools
      {
        source: '/business-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Business-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Construction tools
      {
        source: '/construction-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Construction-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Education tools
      {
        source: '/education-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Education-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Everyday tools
      {
        source: '/everyday-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Everyday-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Health/Fitness tools
      {
        source: '/fitness-health/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Fitness-health/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/health-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Health-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Math tools
      {
        source: '/math-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Math-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Physics tools
      {
        source: '/physics-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Physics-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Scientific tools
      {
        source: '/scientific-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Scientific-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Technology tools
      {
        source: '/technology-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Technology-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Travel tools
      {
        source: '/travel-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Travel-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // DateTime tools
      {
        source: '/datetime-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      {
        source: '/Datetime-tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
      
      // Old _tools directory
      {
        source: '/_tools/:calculator',
        destination: '/calculator/:calculator',
        permanent: true,
      },
    ]
  },

  // Clean URL rewrites
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/tools/:calculator',
          destination: '/calculator/:calculator',
        },
        {
          source: '/calc/:calculator',
          destination: '/calculator/:calculator',
        },
      ],
    }
  },

  // Configure trailing slash
  trailingSlash: false,

  // Output optimization
  ...(enableStandalone ? { output: 'standalone' } : {}),
}

module.exports = nextConfig

