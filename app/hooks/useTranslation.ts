'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';

export const useTranslation = (text: string) => {
  const { currentLocale } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performTranslation = async () => {
      // Reset to original for English
      if (currentLocale === 'en' || !text) {
        setTranslatedText(text);
        return;
      }

      setIsLoading(true);
      try {
        // Import translations dynamically
        const { getStaticTranslation, getCachedTranslation, setCachedTranslation } = await import('../lib/translations');
        
        // Try static first
        const staticTranslation = getStaticTranslation(text, currentLocale);
        if (staticTranslation) {
          setTranslatedText(staticTranslation);
          setIsLoading(false);
          return;
        }
        
        // Try cache
        const cachedTranslation = getCachedTranslation(text, currentLocale);
        if (cachedTranslation) {
          setTranslatedText(cachedTranslation);
          setIsLoading(false);
          return;
        }
        
        // Call API
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
          setCachedTranslation(text, currentLocale, data.result);
          setTranslatedText(data.result);
        } else {
          console.error('Translation failed:', data.error);
          setTranslatedText(text);
        }
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedText(text);
      } finally {
        setIsLoading(false);
      }
    };

    performTranslation();
  }, [text, currentLocale]); // Only depend on text and currentLocale

  return { text: translatedText, isLoading };
};

export const useObjectTranslation = <T extends Record<string, any>>(obj: T) => {
  const { translateObject, currentLocale } = useLanguage();
  const [translatedObj, setTranslatedObj] = useState(obj);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performTranslation = async () => {
      if (currentLocale === 'en') {
        setTranslatedObj(obj);
        return;
      }

      setIsLoading(true);
      try {
        const result = await translateObject(obj);
        setTranslatedObj(result);
      } catch (error) {
        console.error('Object translation failed:', error);
        setTranslatedObj(obj);
      } finally {
        setIsLoading(false);
      }
    };

    performTranslation();
  }, [obj, currentLocale, translateObject]);

  return { data: translatedObj, isLoading };
};
