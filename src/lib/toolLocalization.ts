export type AnyDict = Record<string, any>

function getByPath(dict: AnyDict, key: string): unknown {
  const parts = key.split('.')
  let value: any = dict
  for (const part of parts) {
    value = value?.[part]
    if (value === undefined) return undefined
  }
  return value
}

function firstString(dict: AnyDict, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = getByPath(dict, key)
    if (typeof value === 'string' && value.trim().length > 0) return value
  }
  return undefined
}

function toSnakeCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function stripSuffixes(base: string): string[] {
  const variants = new Set<string>()
  variants.add(base)

  const rules = [
    /_calculator$/,
    /_calc$/,
    /_emi$/,
    /_loan_emi$/,
    /_tool$/,
  ]

  for (const rule of rules) {
    if (rule.test(base)) {
      variants.add(base.replace(rule, ''))
    }
  }

  // Special: if we removed calculator and ended with empty, ignore.
  return Array.from(variants).filter(v => v.length > 0)
}

const OVERRIDES: Record<string, { titleKey: string; descKey?: string }> = {
  'bmi-calculator': { titleKey: 'bmi.title', descKey: 'bmi.description' },
  // Some tools use non-obvious keys.
  'advance-tax-calculator': { titleKey: 'tax.advance_tax_liability_title', descKey: 'tax.advance_tax_liability_desc' },
  'old-vs-new-regime': { titleKey: 'tax.old_vs_new_title', descKey: 'tax.old_vs_new_desc' },
}

const NAMESPACES = ['loan', 'tax', 'investment', 'health', 'real_estate', 'datetime', 'math', 'business', 'education', 'technology', 'scientific', 'physics', 'insurance', 'credit_card', 'banking', 'tools']

export function localizeToolMeta(args: {
  dict: AnyDict
  toolId?: string
  fallbackTitle: string
  fallbackDescription?: string
}): { title: string; description?: string } {
  const { dict, toolId, fallbackTitle, fallbackDescription } = args
  if (!toolId) return { title: fallbackTitle, description: fallbackDescription }

  const override = OVERRIDES[toolId]
  if (override) {
    const title = firstString(dict, [override.titleKey]) ?? fallbackTitle
    const description = override.descKey ? (firstString(dict, [override.descKey]) ?? fallbackDescription) : fallbackDescription
    return { title, description }
  }

  const snake = toSnakeCase(toolId)
  const bases = stripSuffixes(snake)

  // Candidate generation: try common patterns across namespaces.
  const titleKeys: string[] = []
  const descKeys: string[] = []

  for (const ns of NAMESPACES) {
    for (const base of bases) {
      titleKeys.push(`${ns}.${base}_title`)
      descKeys.push(`${ns}.${base}_desc`)

      titleKeys.push(`${ns}.${base}_calculator_title`)
      descKeys.push(`${ns}.${base}_calculator_desc`)

      // Loan tools sometimes drop suffixes like _emi in the key.
      titleKeys.push(`${ns}.${base.replace(/_emi$/, '')}_title`)
      descKeys.push(`${ns}.${base.replace(/_emi$/, '')}_desc`)

      // Some keys include _loan_... naming.
      titleKeys.push(`${ns}.${base.replace(/_loan_emi$/, '_loan')}_title`)
      descKeys.push(`${ns}.${base.replace(/_loan_emi$/, '_loan')}_desc`)
    }
  }

  const title = firstString(dict, titleKeys) ?? fallbackTitle
  const description = fallbackDescription ? (firstString(dict, descKeys) ?? fallbackDescription) : firstString(dict, descKeys)

  return { title, description }
}

export function getDictString(dict: AnyDict, key: string, fallback?: string): string {
  const value = getByPath(dict, key)
  if (typeof value === 'string' && value.trim().length > 0) return value
  return fallback ?? key
}

/**
 * Localize a subcategory name using the `subcategories` namespace.
 * Falls back to the original English name.
 */
export function localizeSubcategoryName(dict: AnyDict, subcategoryKey: string, fallbackName: string): string {
  const snake = toSnakeCase(subcategoryKey)
  const value = firstString(dict, [`subcategories.${snake}`])
  return value ?? fallbackName
}
