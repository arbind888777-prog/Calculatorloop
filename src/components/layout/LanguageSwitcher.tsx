'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages, Check } from 'lucide-react';
import { toolsData } from '@/lib/toolsData';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

const SUPPORTED_LANGS = new Set(languages.map(l => l.code));

function stripLocale(pathname: string) {
  const parts = pathname.split('/');
  const maybeLocale = parts[1];
  if (maybeLocale && SUPPORTED_LANGS.has(maybeLocale)) {
    const rest = '/' + parts.slice(2).join('/');
    return rest === '/' ? '/' : rest.replace(/\/$/, '');
  }
  return pathname;
}

function findCategoryForCalc(id: string): string | null {
  for (const [categoryId, category] of Object.entries(toolsData)) {
    for (const sub of Object.values(category.subcategories ?? {})) {
      if ((sub as any).calculators.find((c: any) => c.id === id)) return categoryId;
    }
  }
  return null;
}

function buildLangPath(basePath: string, code: string): string {
  const parts = basePath.split('/').filter(Boolean);

  // basePath = /calculator/{id}
  if (parts.length === 2 && parts[0] === 'calculator') {
    const calcId = parts[1];
    if (code === 'en') return basePath;
    const cat = findCategoryForCalc(calcId);
    return cat ? `/${code}/${cat}/${calcId}` : `/${code}${basePath}`;
  }

  // basePath = /{category}/{id} (after locale strip from /{lang}/{category}/{id})
  if (parts.length === 2 && (toolsData as any)[parts[0]]) {
    const [cat, calcId] = parts;
    if (code === 'en') return `/calculator/${calcId}`;
    return `/${code}/${cat}/${calcId}`;
  }

  // Other pages (/, /about, /blog, etc.)
  if (code === 'en') return basePath;
  return `/${code}${basePath === '/' ? '' : basePath}`;
}

export default function LanguageSwitcher() {
  const { language, setLanguage } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  const handleChange = (code: string) => {
    setLanguage(code);
    const basePath = stripLocale(pathname || '/');
    const nextPath = buildLangPath(basePath, code);
    router.push(nextPath);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label="Change language"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline-flex items-center gap-1">
            <span className="emoji">{currentLanguage.flag}</span>
            <span className="font-medium">{currentLanguage.code.toUpperCase()}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48 sm:w-56 max-h-[70vh] overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className="flex items-center justify-between cursor-pointer py-2.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="emoji text-base sm:text-lg flex-shrink-0">{lang.flag}</span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate text-sm sm:text-base">{lang.nativeName}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">{lang.name}</span>
              </div>
            </div>
            {language === lang.code && (
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
