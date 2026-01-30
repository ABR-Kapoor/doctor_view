'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LanguageContextType {
  currentLocale: string;
  setLocale: (locale: string) => void;
  translate: (text: string) => Promise<string>;
  translateObject: <T extends Record<string, any>>(obj: T) => Promise<T>;
  translateHtml: (html: string) => Promise<string>;
  availableLocales: string[];
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocale, setCurrentLocale] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const availableLocales = ['en', 'es', 'fr', 'de', 'hi', 'zh', 'ar', 'pt', 'ja', 'bn', 'te', 'mr', 'ta', 'gu'];

  // Load saved locale from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('preferredLocale');
      if (savedLocale && availableLocales.includes(savedLocale)) {
        setCurrentLocale(savedLocale);
      }
    }
  }, []);

  const setLocale = useCallback((locale: string) => {
    setCurrentLocale(locale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', locale);
    }
  }, []);

  const translate = useCallback(async (text: string): Promise<string> => {
    if (!text || currentLocale === 'en') return text;
    
    // Try static translations first (instant)
    const { getStaticTranslation, getCachedTranslation, setCachedTranslation } = await import('../lib/translations');
    
    const staticTranslation = getStaticTranslation(text, currentLocale);
    if (staticTranslation) {
      return staticTranslation;
    }
    
    // Check cache
    const cachedTranslation = getCachedTranslation(text, currentLocale);
    if (cachedTranslation) {
      return cachedTranslation;
    }
    
    try {
      setIsTranslating(true);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLocale: 'en',
          targetLocale: currentLocale,
          type: 'text',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Cache the result
        setCachedTranslation(text, currentLocale, data.result);
        return data.result;
      } else {
        console.error('Translation failed:', data.error);
        return text;
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    } finally {
      setIsTranslating(false);
    }
  }, [currentLocale]);

  const translateObject = useCallback(async <T extends Record<string, any>>(
    obj: T
  ): Promise<T> => {
    if (!obj || currentLocale === 'en') return obj;
    
    try {
      setIsTranslating(true);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: obj,
          sourceLocale: 'en',
          targetLocale: currentLocale,
          type: 'object',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.result as T;
      } else {
        console.error('Object translation failed:', data.error);
        return obj;
      }
    } catch (error) {
      console.error('Object translation error:', error);
      return obj;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLocale]);

  const translateHtml = useCallback(async (html: string): Promise<string> => {
    if (!html || currentLocale === 'en') return html;
    
    try {
      setIsTranslating(true);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: html,
          sourceLocale: 'en',
          targetLocale: currentLocale,
          type: 'html',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.result;
      } else {
        console.error('HTML translation failed:', data.error);
        return html;
      }
    } catch (error) {
      console.error('HTML translation error:', error);
      return html;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLocale]);

  return (
    <LanguageContext.Provider
      value={{
        currentLocale,
        setLocale,
        translate,
        translateObject,
        translateHtml,
        availableLocales,
        isTranslating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
