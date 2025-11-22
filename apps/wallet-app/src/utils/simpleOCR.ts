/**
 * Simple OCR Utility
 * Uses ONLY Tesseract.js - no preprocessing, no filters, no complexity
 */

import Tesseract from 'tesseract.js';

/**
 * Extract text from image using Tesseract.js
 * No preprocessing. No filters. Just direct OCR → text.
 */
export async function simpleOCR(file: File): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        // Optional: Log progress but don't do anything complex
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    return text || '';
  } catch (error: any) {
    console.error('OCR error:', error);
    throw new Error(`OCR failed: ${error.message || 'Unknown error'}`);
  }
}

