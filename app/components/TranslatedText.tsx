'use client';

import React from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';

interface TranslatedTextProps {
  children: string;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'button';
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  children,
  className = '',
  as: Component = 'span',
}) => {
  const { text, isLoading } = useTranslation(children);

  return (
    <Component className={`${className} ${isLoading ? 'opacity-70 transition-opacity' : ''}`}>
      {text}
    </Component>
  );
};
