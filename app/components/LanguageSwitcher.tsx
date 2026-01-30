'use client';

import React from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  hi: 'हिन्दी',
  zh: '中文',
  ar: 'العربية',
  pt: 'Português',
  ja: '日本語',
  bn: 'বাংলা',
  te: 'తెలుగు',
  mr: 'मराठी',
  ta: 'தமிழ்',
  gu: 'ગુજરાતી',
};

export const LanguageSwitcher: React.FC = () => {
  const { currentLocale, setLocale, availableLocales, isTranslating } = useLanguage();

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-gray-600" />
        <select
          value={currentLocale}
          onChange={(e) => setLocale(e.target.value)}
          disabled={isTranslating}
          className="px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm appearance-none cursor-pointer hover:border-primary-400 transition-colors"
          style={{ backgroundImage: 'none' }}
        >
          {availableLocales.map((locale) => (
            <option key={locale} value={locale}>
              {languageNames[locale] || locale.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      {isTranslating && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};
