/**
 * Generate Identity Data from Extracted Fields
 * Prepares data for ZK proof generation
 */

import { extractFields } from '@/utils/extractFields';
import { hashIdentifier } from '../uniqueness/hashIdentifier';
import countriesData from '@/lib/data/countries.json';

export interface IdentityData {
  age: number;
  countryCode: string;
  countryNumeric: number;
  serial: string;
  serialHash: string;
  dob?: string; // ISO date format
}

/**
 * Calculate age from DOB (ISO format: YYYY-MM-DD)
 */
function calculateAge(isoDate: string): number {
  const dob = new Date(isoDate);
  const now = new Date();
  
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();
  
  // Adjust if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  
  return age;
}

/**
 * Get country numeric code from country code
 */
function getCountryNumeric(countryCode: string): number {
  const countries = countriesData.countries as Array<{
    code: string;
    numeric: number;
  }>;
  
  const country = countries.find(c => c.code === countryCode.toUpperCase());
  return country?.numeric || 0;
}

/**
 * Generate identity data from OCR text
 */
export async function generateIdentityData(ocrText: string, extractedFields?: {
  dob?: string;
  documentNumber?: string;
  passportNumber?: string;
  serialNumber?: string;
  voterNumber?: string;
  countryCode?: string;
}): Promise<IdentityData> {
  // Extract fields if not provided
  let dob = extractedFields?.dob;
  let serial = extractedFields?.documentNumber || 
               extractedFields?.passportNumber || 
               extractedFields?.serialNumber || 
               extractedFields?.voterNumber;
  let countryCode = extractedFields?.countryCode;
  
  // Extract from OCR if not provided using simple extractor
  if (!dob || !serial || !countryCode) {
    const extracted = extractFields(ocrText);
    if (!dob && extracted.dob) {
      dob = extracted.dob;
    }
    if (!serial && extracted.documentNumber) {
      serial = extracted.documentNumber;
    }
    if (!countryCode && extracted.countryCode) {
      countryCode = extracted.countryCode;
    }
  }
  
  // Validate required fields
  if (!dob) {
    throw new Error('Date of Birth (DOB) is required but could not be extracted from document');
  }
  
  if (!serial) {
    throw new Error('Document number (serial/passport/VIN) is required but could not be extracted from document');
  }
  
  if (!countryCode) {
    throw new Error('Country code is required but could not be extracted from document');
  }
  
  // Calculate age from DOB
  const age = calculateAge(dob);
  if (age < 0 || age > 150) {
    throw new Error(`Invalid age calculated from DOB: ${age}`);
  }
  
  // Get country numeric code
  const countryNumeric = getCountryNumeric(countryCode);
  if (countryNumeric === 0) {
    throw new Error(`Invalid country code: ${countryCode}`);
  }
  
  // Hash serial number for uniqueness proof
  let serialHash: string;
  try {
    serialHash = await hashIdentifier(serial);
  } catch (error: any) {
    throw new Error(`Failed to hash serial number: ${error.message}`);
  }
  
  return {
    age,
    countryCode: countryCode.toUpperCase(),
    countryNumeric,
    serial,
    serialHash,
    dob,
  };
}

/**
 * Validate identity data before proof generation
 */
export function validateIdentityData(data: IdentityData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.age || data.age < 0 || data.age > 150) {
    errors.push(`Invalid age: ${data.age}`);
  }
  
  if (!data.countryCode || data.countryCode.length !== 2) {
    errors.push(`Invalid country code: ${data.countryCode}`);
  }
  
  if (!data.countryNumeric || data.countryNumeric === 0) {
    errors.push(`Invalid country numeric: ${data.countryNumeric}`);
  }
  
  if (!data.serial || data.serial.length < 6) {
    errors.push(`Invalid serial number: ${data.serial}`);
  }
  
  if (!data.serialHash || !data.serialHash.startsWith('0x')) {
    errors.push(`Invalid serial hash: ${data.serialHash}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

