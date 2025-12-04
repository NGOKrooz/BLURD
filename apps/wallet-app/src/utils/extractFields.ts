/**
 * Robust Document Field Extractor
 * Simple, reliable extraction pipeline for ID documents
 */

import countriesData from '@/lib/data/countries.json';

export interface ExtractedFields {
  success: boolean;
  document_type?: string;
  country?: string;
  country_code?: string;
  id_number?: string;
  full_name?: string;
  date_of_birth?: string;
  expiry_date?: string;
  age?: number;
  nationality?: string;
  raw_text?: string;
  country_confidence_score?: number;
  detected_by?: {
    country?: string[];
    id_number?: string[];
    document_type?: string[];
  };
  // Legacy fields for backward compatibility
  dob?: string;
  countryCode?: string;
  documentNumber?: string;
  voterNumber?: string;
  expiry?: string;
  documentType?: string;
}

/**
 * Normalize text: remove extra spaces, handle OCR artifacts
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
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
 * Parse date string to ISO format (YYYY-MM-DD)
 */
function parseDateToISO(dateStr: string): string | null {
  if (!dateStr) return null;
  
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
      // Try MM/DD/YYYY
      const date1 = new Date(parseInt(year), parseInt(p1) - 1, parseInt(p2));
      if (!isNaN(date1.getTime())) {
        return `${year}-${String(parseInt(p1)).padStart(2, '0')}-${String(parseInt(p2)).padStart(2, '0')}`;
      }
      // Try DD/MM/YYYY
      const date2 = new Date(parseInt(year), month - 1, day);
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
 * Extract all dates from text (to exclude from ID number extraction)
 */
function extractAllDates(text: string): string[] {
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
  return dates;
}

/**
 * Check if string looks like a phone number
 */
function isPhoneNumber(str: string): boolean {
  // Phone patterns: +234, 080, 070, etc.
  const phonePatterns = [
    /^\+?\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}$/,
    /^0\d{9,10}$/,
    /^\d{10,15}$/,
  ];
  return phonePatterns.some(pattern => pattern.test(str.replace(/[\s\-]/g, '')));
}

/**
 * Check if string looks like a monetary value
 */
function isMonetaryValue(str: string): boolean {
  return /^[\$€£¥]?\s*\d+[,\d]*\.?\d*\s*[A-Z]{3}?$/i.test(str);
}

/**
 * Extract document type from text
 */
function detectDocumentType(text: string): { type: string; method: string } | null {
  const normalized = normalizeText(text).toLowerCase();
  
  // Passport patterns
  const passportPatterns = [
    /international\s+passport/i,
    /e-?passport/i,
    /passport/i,
    /passeport/i,
  ];
  for (const pattern of passportPatterns) {
    if (pattern.test(normalized)) {
      return { type: 'passport', method: 'KEYWORDS' };
    }
  }
  
  // Driver's License patterns
  const driverLicensePatterns = [
    /driver['']?s?\s+license/i,
    /driving\s+license/i,
    /driver['']?s?\s+licence/i,
    /frsc/i, // Federal Road Safety Corps (Nigeria)
    /dvla/i, // Driver and Vehicle Licensing Agency
  ];
  for (const pattern of driverLicensePatterns) {
    if (pattern.test(normalized)) {
      return { type: 'driver_license', method: 'KEYWORDS' };
    }
  }
  
  // National ID patterns
  const nationalIdPatterns = [
    /national\s+id/i,
    /national\s+identification/i,
    /nin\s+slip/i,
    /id\s+card/i,
    /identity\s+card/i,
  ];
  for (const pattern of nationalIdPatterns) {
    if (pattern.test(normalized)) {
      return { type: 'national_id', method: 'KEYWORDS' };
    }
  }
  
  // Voter ID patterns
  const voterIdPatterns = [
    /voter['']?s?\s+card/i,
    /voter\s+identification/i,
    /pvc/i, // Permanent Voter Card (Nigeria)
    /vin/i, // Voter Identification Number
  ];
  for (const pattern of voterIdPatterns) {
    if (pattern.test(normalized)) {
      return { type: 'voter_id', method: 'KEYWORDS' };
    }
  }
  
  return null;
}

/**
 * Strong Nigerian detection patterns (HIGHEST PRIORITY)
 */
function detectNigeriaStrong(text: string): { confidence: number; methods: string[] } | null {
  const normalized = normalizeText(text);
  const upperText = normalized.toUpperCase();
  const lowerText = normalized.toLowerCase();
  const methods: string[] = [];
  let confidence = 0;
  
  // Official Names (HIGHEST CONFIDENCE - 1.0)
  const officialNames = [
    /\bNIGERIA\b/i,
    /\bFEDERAL\s+REPUBLIC\s+OF\s+NIGERIA\b/i,
    /\bREPUBLIC\s+OF\s+NIGERIA\b/i,
    /\bFRN\b/i,
    /\bNIGERIAN\b/i,
  ];
  for (const pattern of officialNames) {
    if (pattern.test(normalized)) {
      methods.push('OFFICIAL_NAME');
      confidence = Math.max(confidence, 1.0);
    }
  }
  
  // NIMC and NIN (VERY HIGH CONFIDENCE - 0.95)
  const nimcPatterns = [
    /\bNIMC\b/i,
    /\bNATIONAL\s+IDENTITY\s+MANAGEMENT\s+COMMISSION\b/i,
    /\bNIN\s+SLIP\b/i,
    /\bNIN\b/i,
  ];
  for (const pattern of nimcPatterns) {
    if (pattern.test(normalized)) {
      methods.push('NIMC_KEYWORD');
      confidence = Math.max(confidence, 0.95);
    }
  }
  
  // Document-specific Nigerian keywords (HIGH CONFIDENCE - 0.9)
  const docKeywords = [
    /\bNIN\s+SLIP\b/i,
    /\bCARD\s+NUMBER\b/i,
    /\bDOCUMENT\s+NUMBER\b/i,
    /\bNIMC\s+APP\b/i,
    /\bNATIONAL\s+ID\s+CARD\b/i,
    /\bECOWAS\b/i,
  ];
  for (const pattern of docKeywords) {
    if (pattern.test(normalized)) {
      methods.push('DOCUMENT_KEYWORD');
      confidence = Math.max(confidence, 0.9);
    }
  }
  
  // Local language patterns (MEDIUM-HIGH CONFIDENCE - 0.85)
  const localPatterns = [
    /\b(?:Ugu|Enugu|Abuja|Lagos)\b/i,
    /\bSTATE\s+OF\s+ORIGIN\b/i,
  ];
  for (const pattern of localPatterns) {
    if (pattern.test(normalized)) {
      methods.push('LOCAL_PATTERN');
      confidence = Math.max(confidence, 0.85);
    }
  }
  
  if (confidence > 0) {
    return { confidence, methods };
  }
  
  return null;
}

/**
 * Extract country using multiple methods with CORRECT PRIORITY ORDER
 * Priority: Explicit matches > Official phrases > Nationality > Keywords > Flag > ISO codes
 */
function detectCountry(text: string): { country: string; code: string; methods: string[]; confidence: number } | null {
  const countries = (countriesData?.countries || []) as Array<{
    name: string;
    code: string;
    code3: string;
    flag?: string;
    aliases?: string[];
  }>;
  
  const normalized = normalizeText(text);
  const upperText = normalized.toUpperCase();
  const lowerText = normalized.toLowerCase();
  const methods: string[] = [];
  let confidence = 0;
  
  // PRIORITY 1: Strong Nigerian detection (HIGHEST PRIORITY - OVERRIDES EVERYTHING)
  const nigeriaStrong = detectNigeriaStrong(text);
  if (nigeriaStrong && nigeriaStrong.confidence >= 0.85) {
    const nigeria = countries.find(c => c.name === 'Nigeria');
    if (nigeria) {
      return {
        country: nigeria.name,
        code: nigeria.code,
        methods: ['NIGERIA_STRONG', ...nigeriaStrong.methods],
        confidence: nigeriaStrong.confidence,
      };
    }
  }
  
  // PRIORITY 2: Explicit country name matches (exact or partial) - HIGH CONFIDENCE
  const explicitPatterns = [
    { pattern: /\bNIGERIA\b/i, country: 'Nigeria', confidence: 0.95 },
    { pattern: /\bFEDERAL\s+REPUBLIC\s+OF\s+NIGERIA\b/i, country: 'Nigeria', confidence: 1.0 },
    { pattern: /\bUNITED\s+STATES\s+OF\s+AMERICA\b/i, country: 'United States', confidence: 1.0 },
    { pattern: /\bKINGDOM\s+OF\s+SAUDI\s+ARABIA\b/i, country: 'Saudi Arabia', confidence: 1.0 },
    { pattern: /\bREPUBLIC\s+OF\s+GHANA\b/i, country: 'Ghana', confidence: 1.0 },
  ];
  
  for (const { pattern, country: countryName, confidence: conf } of explicitPatterns) {
    if (pattern.test(normalized)) {
      const country = countries.find(c => c.name === countryName);
      if (country) {
        methods.push('EXPLICIT_MATCH');
        return { country: country.name, code: country.code, methods, confidence: conf };
      }
    }
  }
  
  // PRIORITY 3: Official phrases inside the card
  const officialPhrases = [
    { pattern: /\bNIMC\b/i, country: 'Nigeria', confidence: 0.95 },
    { pattern: /\bNATIONAL\s+IDENTITY\s+MANAGEMENT\s+COMMISSION\b/i, country: 'Nigeria', confidence: 0.95 },
    { pattern: /\bECOWAS\b/i, country: 'Nigeria', confidence: 0.8 }, // ECOWAS is West African, but Nigeria is most common
  ];
  
  for (const { pattern, country: countryName, confidence: conf } of officialPhrases) {
    if (pattern.test(normalized)) {
      const country = countries.find(c => c.name === countryName);
      if (country) {
        methods.push('OFFICIAL_PHRASE');
        return { country: country.name, code: country.code, methods, confidence: conf };
      }
    }
  }
  
  // PRIORITY 4: Nationality field
  const nationalityMatch = text.match(/(?:nationality|country|nation)\s*[:\-\.]?\s*([A-Z]{2,3}|\w+(?:\s+\w+)*)/i);
  if (nationalityMatch) {
    const value = nationalityMatch[1].trim();
    const valueUpper = value.toUpperCase();
    const valueLower = value.toLowerCase();
    
    // Check ISO code
    const countryByCode = countries.find(c => c.code === valueUpper || c.code3 === valueUpper);
    if (countryByCode) {
      methods.push('NATIONALITY');
      // Block Egypt unless very confident
      if (countryByCode.name === 'Egypt') {
        return null; // Reject low-confidence Egypt detection
      }
      return { country: countryByCode.name, code: countryByCode.code, methods, confidence: 0.9 };
    }
    
    // Check country name
    const countryByName = countries.find(c => {
      const nameLower = c.name.toLowerCase();
      return nameLower === valueLower || nameLower.includes(valueLower) || valueLower.includes(nameLower);
    });
    if (countryByName) {
      methods.push('NATIONALITY');
      // Block Egypt unless very confident
      if (countryByName.name === 'Egypt') {
        return null; // Reject low-confidence Egypt detection
      }
      return { country: countryByName.name, code: countryByName.code, methods, confidence: 0.9 };
    }
    
    // Check aliases
    const countryByAlias = countries.find(c => 
      c.aliases?.some(a => {
        const aliasLower = a.toLowerCase();
        return aliasLower === valueLower || aliasLower.includes(valueLower) || valueLower.includes(aliasLower);
      })
    );
    if (countryByAlias) {
      methods.push('NATIONALITY');
      // Block Egypt unless very confident
      if (countryByAlias.name === 'Egypt') {
        return null; // Reject low-confidence Egypt detection
      }
      return { country: countryByAlias.name, code: countryByAlias.code, methods, confidence: 0.9 };
    }
  }
  
  // PRIORITY 5: Document-specific keywords
  const docTypeKeywords = [
    { pattern: /\bNIN\s+SLIP\b/i, country: 'Nigeria', confidence: 0.95 },
    { pattern: /\bPVC\b/i, country: 'Nigeria', confidence: 0.9 }, // Permanent Voter Card (Nigeria)
  ];
  
  for (const { pattern, country: countryName, confidence: conf } of docTypeKeywords) {
    if (pattern.test(normalized)) {
      const country = countries.find(c => c.name === countryName);
      if (country) {
        methods.push('DOCUMENT_KEYWORD');
        return { country: country.name, code: country.code, methods, confidence: conf };
      }
    }
  }
  
  // PRIORITY 6: Flag emojis (reliable but lower priority than explicit matches)
  const flagPattern = /\p{Extended_Pictographic}/gu;
  const flagMatch = text.match(flagPattern);
  if (flagMatch) {
    for (const emoji of flagMatch) {
      const country = countries.find(c => c.flag === emoji);
      if (country) {
        methods.push('FLAG');
        // Block Egypt flag unless very confident (Egypt flag is 🇪🇬)
        if (country.name === 'Egypt') {
          // Only accept if we have other strong indicators
          const hasEgyptKeywords = /\bEGYPT\b/i.test(normalized) || /\bEGYPTIAN\b/i.test(normalized);
          if (!hasEgyptKeywords) {
            continue; // Skip Egypt flag if no other indicators
          }
        }
        return { country: country.name, code: country.code, methods, confidence: 0.85 };
      }
    }
  }
  
  // PRIORITY 7: ISO codes (NGA, USA, UAE, etc.) - but block EG unless very confident
  const isoCodePattern = /\b([A-Z]{2,3})\b/g;
  const isoMatches = [...normalized.matchAll(isoCodePattern)];
  for (const match of isoMatches) {
    const code = match[1].toUpperCase();
    // BLOCK EG (Egypt) unless we have strong evidence
    if (code === 'EG' || code === 'EGY') {
      const hasEgyptKeywords = /\bEGYPT\b/i.test(normalized) || /\bEGYPTIAN\b/i.test(normalized);
      if (!hasEgyptKeywords) {
        continue; // Skip Egypt ISO code
      }
    }
    const country = countries.find(c => c.code === code || c.code3 === code);
    if (country) {
      methods.push('ISO_CODE');
      return { country: country.name, code: country.code, methods, confidence: 0.8 };
    }
  }
  
  // PRIORITY 8: Full country names with word boundaries (prioritize Nigeria first)
  const priorityCountries = ['Nigeria', 'United States', 'United Kingdom', 'Ghana', 'South Africa', 'Saudi Arabia'];
  const sortedCountries = [...countries].sort((a, b) => {
    const aPriority = priorityCountries.indexOf(a.name);
    const bPriority = priorityCountries.indexOf(b.name);
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return b.name.length - a.name.length;
  });
  
  for (const country of sortedCountries) {
    // Skip Egypt unless we have explicit evidence
    if (country.name === 'Egypt') {
      const hasEgyptKeywords = /\bEGYPT\b/i.test(normalized) || /\bEGYPTIAN\b/i.test(normalized);
      if (!hasEgyptKeywords) {
        continue; // Skip Egypt
      }
    }
    
    // Check full name with word boundaries
    const nameRegex = new RegExp(`\\b${country.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (nameRegex.test(normalized)) {
      methods.push('TEXT');
      return { country: country.name, code: country.code, methods, confidence: 0.75 };
    }
    
    // Check aliases
    if (country.aliases) {
      for (const alias of country.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (aliasRegex.test(normalized)) {
          methods.push('TEXT');
          return { country: country.name, code: country.code, methods, confidence: 0.75 };
        }
      }
    }
  }
  
  // PRIORITY 9: All words of country name appear (handles OCR spacing issues) - LOWEST PRIORITY
  for (const country of sortedCountries) {
    // Skip Egypt
    if (country.name === 'Egypt') {
      continue;
    }
    
    const nameWords = country.name.toLowerCase().split(/\s+/);
    if (nameWords.length > 1 && nameWords.every(word => lowerText.includes(word))) {
      methods.push('TEXT_FALLBACK');
      return { country: country.name, code: country.code, methods, confidence: 0.6 };
    }
  }
  
  return null;
}

/**
 * Extract unique ID number (filtering out dates, phone numbers, etc.)
 */
function extractUniqueIdNumber(text: string): { id: string; methods: string[] } | null {
  const normalized = normalizeText(text);
  const dates = extractAllDates(text);
  const excludeWords = ['INDEPENDENT', 'REPUBLIC', 'FEDERAL', 'DEMOCRATIC', 'STATE', 'NATION', 'COUNTRY', 
                        'GOVERNMENT', 'OFFICIAL', 'ISSUED', 'VALID', 'EXPIRY', 'EXPIRES', 'BIRTH', 'DATE'];
  const methods: string[] = [];
  
  // Extract all potential ID numbers with keywords
  const keywordPatterns = [
    { pattern: /(?:VIN|Voter\s*Identification\s*Number|Voter\s*ID\s*Number|Voter\s*Number|Voter\s*ID)\s*[:\-\.\s]*([A-Z0-9]{8,20})/gi, method: 'KEYWORD_MATCH' },
    { pattern: /(?:ID\s*No|ID\s*Number|ID\s*#|ID\s*Num)\s*[:\-\.\s]*([A-Z0-9]{6,20})/gi, method: 'KEYWORD_MATCH' },
    { pattern: /(?:Document\s*No|Document\s*Number|Document\s*#|Doc\s*No)\s*[:\-\.\s]*([A-Z0-9]{6,20})/gi, method: 'KEYWORD_MATCH' },
    { pattern: /(?:NIN|National\s*Identification\s*Number)\s*[:\-\.\s]*([A-Z0-9]{6,20})/gi, method: 'KEYWORD_MATCH' },
    { pattern: /(?:Passport\s*No|Passport\s*Number|Passport\s*#)\s*[:\-\.\s]*([A-Z0-9]{6,20})/gi, method: 'KEYWORD_MATCH' },
    { pattern: /(?:Serial\s*No|Serial\s*Number|Serial\s*#)\s*[:\-\.\s]*([A-Z0-9]{4,20})/gi, method: 'KEYWORD_MATCH' },
    { pattern: /(?:Ref\s*No|Reference\s*Number|Ref\s*#)\s*[:\-\.\s]*([A-Z0-9]{6,20})/gi, method: 'KEYWORD_MATCH' },
  ];
  
  const candidates: Array<{ id: string; method: string; distance: number }> = [];
  
  for (const { pattern, method } of keywordPatterns) {
    const matches = [...normalized.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        let candidate = match[1].toUpperCase().replace(/[\s\-\.]/g, '');
        
        // Validate candidate
        if (candidate.length >= 6 && candidate.length <= 20) {
          // Exclude common words
          if (excludeWords.includes(candidate)) continue;
          
          // Exclude dates
          const isDate = dates.some(date => {
            const dateClean = date.replace(/[\/\-\.\s]/g, '');
            return candidate.includes(dateClean) || dateClean.includes(candidate);
          });
          if (isDate) continue;
          
          // Exclude phone numbers
          if (isPhoneNumber(candidate)) continue;
          
          // Exclude monetary values
          if (isMonetaryValue(candidate)) continue;
          
          // Must have letters and numbers (or be very long)
          const hasLetters = /[A-Z]/.test(candidate);
          const hasNumbers = /[0-9]/.test(candidate);
          if ((hasLetters && hasNumbers) || candidate.length >= 10) {
            // Calculate distance from keyword (prefer closer matches)
            const keywordPos = match.index || 0;
            const idPos = (match.index || 0) + match[0].indexOf(match[1]);
            const distance = Math.abs(keywordPos - idPos);
            
            candidates.push({ id: candidate, method, distance });
            if (!methods.includes(method)) methods.push(method);
          }
        }
      }
    }
  }
  
  // Sort by distance (closer to keyword is better), then by length
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.id.length - a.id.length;
    });
    return { id: candidates[0].id, methods };
  }
  
  // Fallback: Look for unique alphanumeric sequences
  const uniquePattern = /\b([A-Z]{2,}[0-9]{3,}|[0-9]{3,}[A-Z]{2,}|[A-Z0-9]{8,20})\b/g;
  const uniqueMatches = [...normalized.matchAll(uniquePattern)];
  
  const fallbackCandidates = uniqueMatches
    .map(m => m[1].toUpperCase().replace(/[\s\-\.]/g, ''))
    .filter(c => {
      if (c.length < 8 || c.length > 20) return false;
      if (excludeWords.includes(c)) return false;
      if (dates.some(date => {
        const dateClean = date.replace(/[\/\-\.\s]/g, '');
        return c.includes(dateClean) || dateClean.includes(c);
      })) return false;
      if (isPhoneNumber(c)) return false;
      if (isMonetaryValue(c)) return false;
      const hasLetters = /[A-Z]/.test(c);
      const hasNumbers = /[0-9]/.test(c);
      return (hasLetters && hasNumbers) || c.length >= 12;
    })
    .sort((a, b) => {
      const aHasBoth = /[A-Z]/.test(a) && /[0-9]/.test(a);
      const bHasBoth = /[A-Z]/.test(b) && /[0-9]/.test(b);
      if (aHasBoth && !bHasBoth) return -1;
      if (!aHasBoth && bHasBoth) return 1;
      return b.length - a.length;
    });
  
  if (fallbackCandidates.length > 0) {
    methods.push('REGEX');
    return { id: fallbackCandidates[0], methods };
  }
  
  return null;
}

/**
 * Extract full name from document
 */
function extractFullName(text: string): string | null {
  // Look for name patterns near keywords
  const namePatterns = [
    /(?:name|full\s+name|surname|given\s+name)\s*[:\-\.]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /(?:name|full\s+name)\s*[:\-\.]?\s*([A-Z\s]{5,30})/,
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate: should be 2-4 words, each starting with capital letter
      const words = name.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const allValid = words.every(word => /^[A-Z][a-z]+$/.test(word) || /^[A-Z]{2,}$/.test(word));
        if (allValid) {
          return name;
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract date of birth
 */
function extractDateOfBirth(text: string): string | null {
  // Look for DOB near birth keywords
  const birthContextRegex = /(?:date\s+of\s+birth|dob|birth\s+date|born|birth|D\.O\.B|D\.O\.B\.)\s*[:\-\.]?\s*((\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b)|(\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b)|(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b))/i;
  
  let match = text.match(birthContextRegex);
  if (match) {
    const dateStr = match[2] || match[3] || match[4] || match[1];
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
  
  // Try all dates in text (prefer earlier dates)
  const dateRegex = /(\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b)|(\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b)|(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b)/i;
  match = text.match(dateRegex);
  if (match) {
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
 * Extract expiry date
 */
function extractExpiryDate(text: string): string | null {
  const expiryRegex = /(?:valid\s+until|expiry|expires|valid\s+to|expiration)\s*[:\-\.]?\s*(\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b)/i;
  
  const match = text.match(expiryRegex);
  if (match && match[1]) {
    const parsed = parseDateToISO(match[1]);
    if (parsed) {
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
 * Main extraction function
 * Always returns a result, even if extraction is partial
 * Never throws errors - returns best-effort extraction
 */
export function extractFields(rawText: string): ExtractedFields {
  const result: ExtractedFields = {
    success: false,
    detected_by: {},
  };
  
  try {
    if (!rawText || rawText.trim().length === 0) {
      return result;
    }
    
    result.raw_text = rawText;
    result.success = true;
  
    // Detect document type
    try {
      const docType = detectDocumentType(rawText);
      if (docType) {
        result.document_type = docType.type;
        result.documentType = docType.type; // Legacy
        result.detected_by!.document_type = [docType.method];
      }
    } catch (e) {
      // Silently continue if document type detection fails
    }
    
    // Detect country
    try {
      let countryData = detectCountry(rawText);
      
      // VALIDATION LAYER: Enforce Nigeria if Nigerian keywords found
      const hasNigerianKeywords = 
        /\bNIGERIA\b/i.test(rawText) ||
        /\bNIGERIAN\b/i.test(rawText) ||
        /\bNIMC\b/i.test(rawText) ||
        /\bNIN\b/i.test(rawText) ||
        /\bECOWAS\b/i.test(rawText) ||
        /\bFEDERAL\s+REPUBLIC\s+OF\s+NIGERIA\b/i.test(rawText);
      
      const hasNigeriaFlag = /🇳🇬/.test(rawText);
      
      // If Nigerian indicators found, enforce Nigeria
      if (hasNigerianKeywords || hasNigeriaFlag) {
        const countries = (countriesData?.countries || []) as Array<{
          name: string;
          code: string;
          code3: string;
          flag?: string;
          aliases?: string[];
        }>;
        const nigeria = countries.find(c => c.name === 'Nigeria');
        if (nigeria) {
          countryData = {
            country: nigeria.name,
            code: nigeria.code,
            methods: ['VALIDATION_OVERRIDE', ...(countryData?.methods || [])],
            confidence: 1.0,
          };
        }
      }
      
      // BLOCK EGYPT: Reject Egypt unless confidence > 90%
      if (countryData && countryData.country === 'Egypt' && countryData.confidence < 0.90) {
        // Reject low-confidence Egypt detection
        countryData = null;
      }
      
      if (countryData) {
        result.country = countryData.country;
        result.country_code = countryData.code;
        result.countryCode = countryData.code; // Legacy
        result.nationality = countryData.country;
        result.country_confidence_score = countryData.confidence;
        result.detected_by!.country = countryData.methods;
      }
    } catch (e) {
      // Silently continue if country detection fails
    }
    
    // Extract unique ID number
    try {
      const idData = extractUniqueIdNumber(rawText);
      if (idData) {
        result.id_number = idData.id;
        result.documentNumber = idData.id; // Legacy
        
        // Check if it's a VIN
        if (/VIN|Voter/i.test(rawText) && idData.id.length >= 10) {
          result.voterNumber = idData.id;
        }
        
        result.detected_by!.id_number = idData.methods;
      }
    } catch (e) {
      // Silently continue if ID extraction fails
    }
    
    // Extract full name
    try {
      const fullName = extractFullName(rawText);
      if (fullName) {
        result.full_name = fullName;
      }
    } catch (e) {
      // Silently continue if name extraction fails
    }
    
    // Extract date of birth
    try {
      const dob = extractDateOfBirth(rawText);
      if (dob) {
        result.date_of_birth = dob;
        result.dob = dob; // Legacy
        const age = calculateAge(dob);
        if (age !== null) {
          result.age = age;
        }
      }
    } catch (e) {
      // Silently continue if DOB extraction fails
    }
    
    // Extract expiry date
    try {
      const expiry = extractExpiryDate(rawText);
      if (expiry) {
        result.expiry_date = expiry;
        result.expiry = expiry; // Legacy
      }
    } catch (e) {
      // Silently continue if expiry extraction fails
    }
    
    return result;
  } catch (error: any) {
    // If anything goes wrong, return a minimal result with the raw text
    console.error('Extraction error (non-fatal):', error);
    return {
      success: true, // Still mark as success to show partial results
      raw_text: rawText,
      detected_by: {},
    };
  }
}
