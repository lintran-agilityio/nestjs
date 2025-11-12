/**
 * Safely extracts a field value from a request body while normalising scalars.
 * Ensures the returned value is a string when possible to simplify downstream validation.
 */
export const getBodyFieldValue = (
  body: Record<string, unknown>,
  field: string,
): string | undefined => {
  const value = body[field];

  // Ensure the value is a string before returning
  if (typeof value === 'string') {
    return value;
  }

  // Handle case where value might be a number (convert to string)
  if (typeof value === 'number') {
    return value.toString();
  }

  return undefined;
};

/**
 * Converts a select fields configuration object to an array of field names
 *
 * @param selectFields - Object with field names as keys and boolean values
 * @returns Array of field names where the value is true
 */
export const getSelectFields = (
  selectFields: Record<string, boolean>,
): string[] =>
  Object.entries(selectFields)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

/**
 * Split array into chunks of specified size
 *
 * @param array - Object array
 * @param chunkSize - Specified size
 * @returns Array of specified size
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Type guard to ensure value is a plain object (non-null object literal).
 */
export const isPlainObject = (
  candidate: unknown,
): candidate is Record<string, unknown> =>
  candidate !== null &&
  typeof candidate === 'object' &&
  !Array.isArray(candidate);

/**
 * Mutates a target object with provided partial updates.
 * Only keys with defined values are applied, preserving falsy values such as `0` or `''`.
 */
export const updateObjectFields = <
  TTarget extends object,
  TUpdates extends Partial<TTarget>,
>(
  existedData: TTarget,
  paramUpdate: TUpdates,
): TTarget => {
  (
    Object.entries(paramUpdate) as [
      keyof TTarget,
      TTarget[keyof TTarget] | undefined,
    ][]
  ).forEach(([key, value]) => {
    if (value !== undefined) {
      existedData[key] = value;
    }
  });
  return existedData;
};
