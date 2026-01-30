import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLocale, targetLocale, type = 'text' } = await request.json();

    if (!text || !targetLocale) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // If target is English, return as-is
    if (targetLocale === 'en') {
      return NextResponse.json({ success: true, result: text });
    }

    // Dynamically import Lingo.dev SDK (server-side only)
    const { LingoDotDevEngine } = await import('lingo.dev/sdk');
    
    const lingoDotDev = new LingoDotDevEngine({
      apiKey: process.env.LINGODOTDEV_API_KEY || process.env.NEXT_PUBLIC_LINGODOTDEV_API_KEY || '',
      batchSize: 100,
      idealBatchItemSize: 1000,
    });

    let result;
    switch (type) {
      case 'text':
        result = await lingoDotDev.localizeText(text, {
          sourceLocale: sourceLocale || 'en',
          targetLocale,
        });
        break;
      case 'object':
        result = await lingoDotDev.localizeObject(text, {
          sourceLocale: sourceLocale || 'en',
          targetLocale,
        });
        break;
      case 'html':
        result = await lingoDotDev.localizeHtml(text, {
          sourceLocale: sourceLocale || 'en',
          targetLocale,
        });
        break;
      default:
        throw new Error('Invalid translation type');
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Translation failed' },
      { status: 500 }
    );
  }
}
