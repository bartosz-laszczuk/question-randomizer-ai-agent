/**
 * Common Validators and Utilities
 *
 * Shared validation and transformation utilities.
 */

/**
 * Remove undefined properties from an object
 *
 * This is needed for TypeScript's exactOptionalPropertyTypes mode.
 * Objects with undefined values need to have those properties removed.
 */
export function removeUndefined<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}
