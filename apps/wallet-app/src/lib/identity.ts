/**
 * Local device identity system
 * Replaces wallet-based identity with a simple localStorage-based userId
 */

/**
 * Get or create a unique user ID for this device
 * @returns A unique identifier stored in localStorage
 * Safe for SSR - returns empty string if localStorage is not available
 */
export function getUserId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return '';
  }
  
  const key = 'blurd_user_id';
  let userId = localStorage.getItem(key);
  
  if (!userId) {
    // Generate a new UUID-like identifier
    userId = `user_${crypto.randomUUID()}`;
    localStorage.setItem(key, userId);
  }
  
  return userId;
}

/**
 * Set a custom user ID (for testing or migration)
 * @param id The user ID to set
 */
export function setUserId(id: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem('blurd_user_id', id);
}

/**
 * Clear the user ID (for testing or logout)
 */
export function clearUserId(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem('blurd_user_id');
}

/**
 * Check if a user ID exists
 * @returns true if a user ID is set
 */
export function hasUserId(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  return !!localStorage.getItem('blurd_user_id');
}

