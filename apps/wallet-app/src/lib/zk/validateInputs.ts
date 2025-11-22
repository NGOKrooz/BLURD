/**
 * Input Validation Utilities for ZK Proof Circuits
 * Validates inputs match expected circuit signal structure
 */

export interface CircuitSignalInfo {
  name: string;
  type: 'scalar' | 'array';
  description?: string;
}

/**
 * Expected signals per circuit type
 * Derived from circuit verification keys and circuit definitions
 */
export const expectedSignals: Record<string, CircuitSignalInfo[]> = {
  age18: [
    { name: 'userAge', type: 'scalar', description: 'User age as integer' },
    { name: 'minAge', type: 'scalar', description: 'Minimum required age' },
  ],
  country: [
    { name: 'userCountryHash', type: 'scalar', description: 'Hashed user country code' },
    { name: 'requiredCountryHash', type: 'scalar', description: 'Hashed required country code' },
  ],
  credential: [
    { name: 'credentialHash', type: 'scalar', description: 'Hashed credential data' },
  ],
  uniqueness: [
    { name: 'walletHash', type: 'scalar', description: 'Hashed wallet address' },
  ],
};

/**
 * Validate input shape matches expected circuit signals
 */
export function validateInputShape(
  inputs: Record<string, any>,
  circuitType: keyof typeof expectedSignals
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const expected = expectedSignals[circuitType];

  if (!expected) {
    return {
      valid: false,
      errors: [`Unknown circuit type: ${circuitType}`],
    };
  }

  // Check all expected signals are present
  for (const signal of expected) {
    if (!(signal.name in inputs)) {
      errors.push(`Missing required signal: ${signal.name}`);
    }
  }

  // Check no extra signals
  const inputKeys = Object.keys(inputs);
  const expectedNames = expected.map(s => s.name);
  for (const key of inputKeys) {
    if (!expectedNames.includes(key)) {
      errors.push(`Unexpected signal: ${key}`);
    }
  }

  // Check signal types
  for (const signal of expected) {
    const value = inputs[signal.name];
    if (value === undefined) continue;

    if (signal.type === 'scalar') {
      if (Array.isArray(value)) {
        errors.push(`Signal '${signal.name}' should be scalar but got array`);
      }
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
        errors.push(`Signal '${signal.name}' should be scalar (string/number/bigint) but got ${typeof value}`);
      }
    } else if (signal.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`Signal '${signal.name}' should be array but got ${typeof value}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate and normalize scalar input
 */
export function validateScalarInput(
  value: any,
  signalName: string,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): { valid: boolean; normalized?: string; error?: string } {
  // Check if it's an array or object (invalid for scalar)
  if (Array.isArray(value)) {
    return {
      valid: false,
      error: `Expected scalar for '${signalName}' but got array: ${JSON.stringify(value)}`,
    };
  }

  if (typeof value === 'object' && value !== null) {
    return {
      valid: false,
      error: `Expected scalar for '${signalName}' but got object: ${JSON.stringify(value)}`,
    };
  }

  // Convert to number if needed
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return {
        valid: false,
        error: `Cannot parse '${signalName}' as number: ${value}`,
      };
    }
    num = parsed;
  } else if (typeof value === 'bigint') {
    num = Number(value);
  } else {
    return {
      valid: false,
      error: `Invalid type for '${signalName}': ${typeof value}`,
    };
  }

  // Apply integer constraint
  if (options?.integer) {
    num = Math.floor(num);
  }

  // Apply min/max constraints
  if (options?.min !== undefined && num < options.min) {
    return {
      valid: false,
      error: `'${signalName}' (${num}) is less than minimum (${options.min})`,
    };
  }

  if (options?.max !== undefined && num > options.max) {
    return {
      valid: false,
      error: `'${signalName}' (${num}) is greater than maximum (${options.max})`,
    };
  }

  return {
    valid: true,
    normalized: String(num),
  };
}

