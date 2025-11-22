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
 */
function extractDocumentNumber(text: string): string | null {
  // Look for labeled patterns first
  const labeledPatterns = [
    /(?:document|doc|id|identification)\s*(?:number|no|#)\s*[:\-\.]?\s*([A-Z0-9]{6,12})/gi,
    /(?:passport)\s*(?:number|no|#)\s*[:\-\.]?\s*([A-Z0-9]{6,12})/gi,
    /(?:serial)\s*(?:number|no|#)\s*[:\-\.]?\s*([A-Z0-9]{4,12})/gi,
    /(?:ID|ID\s*NO|ID\s*#)\s*[:\-\.]?\s*([A-Z0-9]{6,12})/gi,
  ];
  
  for (const pattern of labeledPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase().replace(/\s+/g, '');
    }
  }
  
  // Fallback: any uppercase alphanumeric 6-12 chars
  const generalPattern = /([A-Z0-9]{6,12})/g;
  const matches = text.match(generalPattern);
  if (matches && matches.length > 0) {
    // Prefer longer matches
    const sorted = matches.sort((a, b) => b.length - a.length);
    return sorted[0].toUpperCase();
  }
  
  return null;
}

/**
 * Extract country from text
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
  
  // Method 1: Flag emojis
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
  
  // Method 2: "Nationality:" label
  const nationalityMatch = text.match(/nationality\s*[:\-\.]?\s*([A-Z]{2,3}|\w+)/i);
  if (nationalityMatch) {
    const value = nationalityMatch[1].trim().toUpperCase();
    // Check if it's an ISO code
    const country = countries.find(c => c.code === value || c.code3 === value);
    if (country) {
      return {
        country: country.name,
        countryCode: country.code,
      };
    }
    // Check if it's a country name
    const countryByName = countries.find(c => 
      c.name.toLowerCase() === value.toLowerCase() ||
      c.aliases?.some(a => a.toLowerCase() === value.toLowerCase())
    );
    if (countryByName) {
      return {
        country: countryByName.name,
        countryCode: countryByName.code,
      };
    }
  }
  
  // Method 3: Country names (exact match in text)
  for (const country of countries) {
    if (lowerText.includes(country.name.toLowerCase())) {
      return {
        country: country.name,
        countryCode: country.code,
      };
    }
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

