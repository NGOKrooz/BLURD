/**
 * Simple Field Extractor
 * One function, one regex per field, no complexity
 */

import countriesData from '@/lib/data/countries.json';

export interface ExtractedFields {
  dob?: string; // ISO date format: YYYY-MM-DD
  age?: number;
  country?: string;
  countryCode?: string;
  nationality?: string;
  documentNumber?: string;
  expiry?: string;
  documentType?: string; // e.g., "passport", "id_card", "driver_license"
}

/**
 * Calculate age from DOB
 */
function calculateAge(dob: string): number | null {
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 && age <= 150 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Parse date string to ISO format
 */
function parseDateToISO(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Clean date string
  const cleaned = dateStr.trim().replace(/\s+/g, ' ');
  
  // Try DD/MM/YYYY or MM/DD/YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddmmyyyy) {
    const [, p1, p2, year] = ddmmyyyy;
    const month = parseInt(p2);
    const day = parseInt(p1);
    
    // Heuristic: if first part > 12, it's DD/MM/YYYY
    if (parseInt(p1) > 12) {
      const date = new Date(parseInt(year), month - 1, day);
      if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    } else {
      // Could be MM/DD/YYYY
      const date1 = new Date(parseInt(year), parseInt(p1) - 1, parseInt(p2));
      const date2 = new Date(parseInt(year), month - 1, day);
      // Try both and pick valid one
      if (!isNaN(date1.getTime())) {
        return `${year}-${String(parseInt(p1)).padStart(2, '0')}-${String(parseInt(p2)).padStart(2, '0')}`;
      }
      if (!isNaN(date2.getTime())) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  
  // Try YYYY-MM-DD
  const yyyymmdd = cleaned.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  
  // Try text date: "12 Dec 1999" or "Dec 12 1999"
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const textDate = cleaned.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (textDate) {
    const monthName = textDate[0].match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)?.[0]?.toLowerCase();
    const month = monthName ? monthNames.indexOf(monthName) + 1 : null;
    const day = parseInt(textDate[1]);
    const year = parseInt(textDate[2]);
    
    if (month && day && year) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  
  return null;
}

/**
 * Extract DOB from text
 * Uses ONE regex pattern for all date formats as specified
 */
function extractDOB(text: string): string | null {
  // ONE regex for all date formats: DD/MM/YYYY, YYYY-MM-DD, MM-DD-YYYY, 12 Dec 1999, Dec 12 1999
  const dateRegex = /(\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b)|(\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b)|(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b)/i;
  
  // Look for dates near birth keywords first
  const birthContextRegex = /(?:date\s+of\s+birth|dob|birth\s+date|born|birth|D\.O\.B|D\.O\.B\.)\s*[:\-\.]?\s*((\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b)|(\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b)|(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b))/i;
  
  let match = text.match(birthContextRegex);
  if (match) {
    // Find the first non-undefined capture group (the actual date)
    const dateStr = match[2] || match[3] || match[4] || match[1];
    if (dateStr) {
      const parsed = parseDateToISO(dateStr);
      if (parsed) {
        // Validate it's a reasonable DOB
        const dobDate = new Date(parsed);
        const today = new Date();
        if (dobDate < today && dobDate > new Date(1900, 0, 1)) {
          return parsed;
        }
      }
    }
  }
  
  // Try all date matches in text
  match = text.match(dateRegex);
  if (match) {
    // Find the first non-undefined capture group
    const dateStr = match[1] || match[2] || match[3];
    if (dateStr) {
      const parsed = parseDateToISO(dateStr);
      if (parsed) {
        const dobDate = new Date(parsed);
        const today = new Date();
        if (dobDate < today && dobDate > new Date(1900, 0, 1)) {
          return parsed;
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract document number from text
 * Looks for unique numbers that stand out (not dates, not common numbers)
 */
function extractDocumentNumber(text: string): string | null {
  // First, extract all potential dates to exclude them
  const datePatterns = [
    /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,
    /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
  ];
  const dates: string[] = [];
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) dates.push(...matches);
  });

  // Look for labeled patterns first (most reliable)
  const labeledPatterns = [
    /(?:document|doc|id|identification)\s*(?:number|no|#)\s*[:\-\.]?\s*([A-Z0-9]{6,15})/gi,
    /(?:passport)\s*(?:number|no|#)\s*[:\-\.]?\s*([A-Z0-9]{6,15})/gi,
    /(?:serial)\s*(?:number|no|#)\s*[:\-\.]?\s*([A-Z0-9]{4,15})/gi,
    /(?:ID|ID\s*NO|ID\s*#)\s*[:\-\.]?\s*([A-Z0-9]{6,15})/gi,
    /(?:license|licence)\s*(?:number|no|#)\s*[:\-\.]?\s*([A-Z0-9]{6,15})/gi,
  ];
  
  for (const pattern of labeledPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        const candidate = match[1].toUpperCase().replace(/\s+/g, '');
        // Validate: should be mostly alphanumeric, not a date, and have some uniqueness
        if (candidate.length >= 6 && candidate.length <= 15) {
          // Check if it's not a date
          const isDate = dates.some(date => candidate.includes(date.replace(/[\/\-\.]/g, '')));
          if (!isDate) {
            // Check if it has enough uniqueness (mix of letters and numbers, or long enough)
            const hasLetters = /[A-Z]/.test(candidate);
            const hasNumbers = /[0-9]/.test(candidate);
            if ((hasLetters && hasNumbers) || candidate.length >= 8) {
              return candidate;
            }
          }
        }
      }
    }
  }
  
  // Fallback: Look for unique alphanumeric sequences that stand out
  // Pattern: 6-15 chars, mix of letters/numbers, not near date keywords
  const uniquePattern = /\b([A-Z]{2,}[0-9]{3,}|[0-9]{3,}[A-Z]{2,}|[A-Z0-9]{8,15})\b/g;
  const uniqueMatches = [...text.matchAll(uniquePattern)];
  
  // Filter out dates and common patterns
  const candidates = uniqueMatches
    .map(m => m[1].toUpperCase().replace(/\s+/g, ''))
    .filter(c => {
      if (c.length < 6 || c.length > 15) return false;
      // Exclude if it looks like a date
      if (dates.some(date => c.includes(date.replace(/[\/\-\.]/g, '')))) return false;
      // Prefer sequences with both letters and numbers
      const hasLetters = /[A-Z]/.test(c);
      const hasNumbers = /[0-9]/.test(c);
      return (hasLetters && hasNumbers) || c.length >= 10;
    })
    .sort((a, b) => {
      // Prefer longer, more complex sequences
      const aComplexity = (/[A-Z]/.test(a) ? 1 : 0) + (/[0-9]/.test(a) ? 1 : 0);
      const bComplexity = (/[A-Z]/.test(b) ? 1 : 0) + (/[0-9]/.test(b) ? 1 : 0);
      if (bComplexity !== aComplexity) return bComplexity - aComplexity;
      return b.length - a.length;
    });
  
  return candidates.length > 0 ? candidates[0] : null;
}

/**
 * Extract country from text
 * Looks for full country names like "Federal Republic of Nigeria" or "United States of America"
 * Also checks for flag emojis and nationality labels
 */
function extractCountry(text: string): { country?: string; countryCode?: string } | null {
  const countries = (countriesData?.countries || []) as Array<{
    name: string;
    code: string;
    code3: string;
    flag?: string;
    aliases?: string[];
  }>;
  
  const lowerText = text.toLowerCase();
  
  // Method 1: Flag emojis (most reliable visual indicator)
  const flagPattern = /\p{Extended_Pictographic}/gu;
  const flagMatch = text.match(flagPattern);
  if (flagMatch) {
    for (const emoji of flagMatch) {
      const country = countries.find(c => c.flag === emoji);
      if (country) {
        return {
          country: country.name,
          countryCode: country.code,
        };
      }
    }
  }
  
  // Method 2: Full official country names (e.g., "Federal Republic of Nigeria", "United States of America")
  // Sort by length (longest first) to match full names before partial matches
  const sortedCountries = [...countries].sort((a, b) => b.name.length - a.name.length);
  
  for (const country of sortedCountries) {
    // Check full name
    if (lowerText.includes(country.name.toLowerCase())) {
      return {
        country: country.name,
        countryCode: country.code,
      };
    }
    // Check aliases (including full official names)
    if (country.aliases) {
      for (const alias of country.aliases) {
        if (lowerText.includes(alias.toLowerCase())) {
          return {
            country: country.name,
            countryCode: country.code,
          };
        }
      }
    }
  }
  
  // Method 3: "Nationality:" or "Country:" label
  const nationalityMatch = text.match(/(?:nationality|country|nation)\s*[:\-\.]?\s*([A-Z]{2,3}|\w+(?:\s+\w+)*)/i);
  if (nationalityMatch) {
    const value = nationalityMatch[1].trim();
    const valueUpper = value.toUpperCase();
    
    // Check if it's an ISO code
    const countryByCode = countries.find(c => c.code === valueUpper || c.code3 === valueUpper);
    if (countryByCode) {
      return {
        country: countryByCode.name,
        countryCode: countryByCode.code,
      };
    }
    
    // Check if it's a country name (full or partial)
    const countryByName = countries.find(c => {
      const nameLower = c.name.toLowerCase();
      const valueLower = value.toLowerCase();
      // Exact match or contains the value
      return nameLower === valueLower || nameLower.includes(valueLower) || valueLower.includes(nameLower);
    });
    if (countryByName) {
      return {
        country: countryByName.name,
        countryCode: countryByName.code,
      };
    }
    
    // Check aliases
    const countryByAlias = countries.find(c => 
      c.aliases?.some(a => {
        const aliasLower = a.toLowerCase();
        const valueLower = value.toLowerCase();
        return aliasLower === valueLower || aliasLower.includes(valueLower) || valueLower.includes(aliasLower);
      })
    );
    if (countryByAlias) {
      return {
        country: countryByAlias.name,
        countryCode: countryByAlias.code,
      };
    }
  }
  
  return null;
}

/**
 * Extract expiry date from text
 */
function extractExpiry(text: string): string | null {
  // Look for expiry keywords
  const expiryRegex = /(?:valid\s+until|expiry|expires|valid\s+to)\s*[:\-\.]?\s*(\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b)/i;
  
  const match = text.match(expiryRegex);
  if (match && match[1]) {
    const parsed = parseDateToISO(match[1]);
    if (parsed) {
      // Validate it's a future date
      const expiryDate = new Date(parsed);
      const today = new Date();
      if (expiryDate > today) {
        return parsed;
      }
    }
  }
  
  return null;
}

/**
 * Extract all fields from OCR text
 * ONE function, simple, clean
 */
export function extractFields(rawText: string): ExtractedFields {
  const fields: ExtractedFields = {};
  
  if (!rawText || rawText.trim().length === 0) {
    return fields;
  }
  
  // Extract DOB
  const dob = extractDOB(rawText);
  if (dob) {
    fields.dob = dob;
    const age = calculateAge(dob);
    if (age !== null) {
      fields.age = age;
    }
  }
  
  // Extract document number
  const docNumber = extractDocumentNumber(rawText);
  if (docNumber) {
    fields.documentNumber = docNumber;
  }
  
  // Extract country
  const countryData = extractCountry(rawText);
  if (countryData) {
    fields.country = countryData.country;
    fields.countryCode = countryData.countryCode;
    fields.nationality = countryData.country;
  }
  
  // Extract expiry
  const expiry = extractExpiry(rawText);
  if (expiry) {
    fields.expiry = expiry;
  }
  
  return fields;
}

