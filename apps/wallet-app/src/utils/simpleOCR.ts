/**
 * Simple OCR Utility
 * Uses ONLY Tesseract.js - no preprocessing, no filters, no complexity
 * MVP: Always returns text (even if empty) - never throws errors
 */

import Tesseract from 'tesseract.js';

/**
 * Extract text from image using Tesseract.js
 * No preprocessing. No filters. Just direct OCR → text.
 * MVP: Returns empty string on failure instead of throwing
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
    console.warn('OCR error (non-fatal, continuing with empty text):', error);
    // MVP: Return empty string instead of throwing - allows partial extraction
    return '';
  }
}

