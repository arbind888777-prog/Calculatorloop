// Import JSON locale files
import enTranslations from '@/locales/en.json';
import hiTranslations from '@/locales/hi.json';
import taTranslations from '@/locales/ta.json';
import teTranslations from '@/locales/te.json';
import bnTranslations from '@/locales/bn.json';
import mrTranslations from '@/locales/mr.json';
import guTranslations from '@/locales/gu.json';
import esTranslations from '@/locales/es.json';
import ptTranslations from '@/locales/pt.json';
import frTranslations from '@/locales/fr.json';
import deTranslations from '@/locales/de.json';
import idTranslations from '@/locales/id.json';
import arTranslations from '@/locales/ar.json';
import urTranslations from '@/locales/ur.json';
import jaTranslations from '@/locales/ja.json';

// Export all translations
export const translations = {
  en: enTranslations,
  hi: hiTranslations,
  ta: taTranslations,
  te: teTranslations,
  bn: bnTranslations,
  mr: mrTranslations,
  gu: guTranslations,
  es: esTranslations,
  pt: ptTranslations,
  fr: frTranslations,
  de: deTranslations,
  id: idTranslations,
  ar: arTranslations,
  ur: urTranslations,
  ja: jaTranslations,
} as const;

export type LanguageCode = keyof typeof translations;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge<TBase extends Record<string, any>, TOverride extends Record<string, any>>(
  base: TBase,
  override: TOverride
): TBase & TOverride {
  const result: Record<string, any> = { ...base }
  for (const [key, overrideValue] of Object.entries(override ?? {})) {
    const baseValue = (base as any)[key]
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue)
    } else {
      result[key] = overrideValue
    }
  }
  return result as TBase & TOverride
}

/**
 * Returns a translation object that is always safe to read from.
 * It deep-merges English as the base with the selected language.
 * This prevents runtime crashes like "Cannot read properties of undefined (reading 'nav')".
 */
export function getMergedTranslations(language: string | LanguageCode = 'en') {
  const langCode = (language || 'en') as LanguageCode
  const selected = (translations as any)[langCode] || {}
  return deepMerge(translations.en as any, selected as any)
}

/**
 * Get a translation by key with dot notation support
 * @param lang - Language code
 * @param key - Translation key (e.g., 'nav.home', 'common.calculate')
 * @returns Translated string or key if not found
 */
export function getTranslation(lang: LanguageCode = 'en', key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }

  // Fallback to English if translation not found
  if (value === undefined) {
    value = translations.en;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
  }

  return value || key;
}

/**
 * Get all translations for a specific namespace
 * @param lang - Language code
 * @param namespace - Namespace key (e.g., 'nav', 'common')
 * @returns Object with all translations in that namespace
 */
export function getNamespace(lang: LanguageCode = 'en', namespace: string): Record<string, any> {
  const value = (translations[lang] as any)?.[namespace];

  // Fallback to English if namespace not found
  if (!value) {
    return (translations.en as any)?.[namespace] || {};
  }

  return value;
}

/**
 * Check if a translation key exists
 * @param lang - Language code
 * @param key - Translation key
 * @returns True if key exists
 */
export function hasTranslation(lang: LanguageCode, key: string): boolean {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return false;
  }

  return true;
}
