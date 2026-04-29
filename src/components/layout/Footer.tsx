"use client"

import Link from "next/link"
import { Calculator, Github, Twitter, Mail } from "lucide-react"
import { useSettings } from "@/components/providers/SettingsProvider"
import { getMergedTranslations } from "@/lib/translations"
import NewsletterSignup from "@/components/email/NewsletterSignup"

export function Footer() {
  const { language } = useSettings()
  const t = getMergedTranslations(language)
  const currentYear = new Date().getFullYear()

  const prefix = language === "en" ? "" : `/${language}`
  const withLocale = (path: string) => `${prefix}${path}`

  const footerLinks = {
    resources: [
      { label: t.hero.popularTools, href: withLocale("/popular") },
      { label: t.nav.blog, href: withLocale("/blog") },
      { label: t.nav.history, href: withLocale("/history") },
      { label: t.nav.favorites, href: withLocale("/favorites") },
    ],
    company: [
      { label: t.footer.aboutUs, href: withLocale("/about") },
      { label: t.footer.contact, href: withLocale("/contact") },
      { label: t.footer.privacyPolicy, href: withLocale("/privacy") },
      { label: t.footer.termsOfService, href: withLocale("/terms") },
    ],
  }

  return (
    <footer className="w-full border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Link href={withLocale("/")} className="flex items-center gap-2 text-xl font-bold text-primary">
              <Calculator className="h-6 w-6" />
              <span>Calculator Hub</span>
            </Link>
            <p className="text-sm text-muted-foreground">{t.footer.tagline}</p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors hover:bg-secondary/80"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors hover:bg-secondary/80"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="mailto:contact@calculatorhub.com"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors hover:bg-secondary/80"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>

            <div className="pt-2">
              <NewsletterSignup variant="footer" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t.footer.resources}</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t.footer.company}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} Calculator Hub. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
