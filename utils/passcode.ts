import { hash, compare } from 'bcryptjs';

/**
 * Hash a passcode for secure storage
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const saltRounds = 10;
  return await hash(passcode, saltRounds);
}

/**
 * Verify a passcode against a hash
 */
export async function verifyPasscode(
  passcode: string,
  hash: string
): Promise<boolean> {
  return await compare(passcode, hash);
}

/**
 * Validate passcode format
 * 4-6 digits or alphanumeric characters
 */
export function validatePasscode(passcode: string): {
  valid: boolean;
  error?: string;
} {
  if (!passcode || passcode.length < 4 || passcode.length > 6) {
    return {
      valid: false,
      error: 'Passcode must be 4-6 characters long',
    };
  }

  // Allow digits only (recommended) or alphanumeric
  const digitOnly = /^\d+$/.test(passcode);
  const alphanumeric = /^[a-zA-Z0-9]+$/.test(passcode);

  if (!digitOnly && !alphanumeric) {
    return {
      valid: false,
      error: 'Passcode can only contain numbers and letters',
    };
  }

  return { valid: true };
}

