/**
 * Generate a unique invite code (6-8 characters)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 6; // 6 characters for simplicity
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * Validate invite code format
 */
export function validateInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6,8}$/.test(code.toUpperCase());
}

/**
 * Generate magic link for a plan
 */
export function generateMagicLink(planId: string, baseUrl: string = window.location.origin): string {
  return `${baseUrl}/join/${planId}`;
}

