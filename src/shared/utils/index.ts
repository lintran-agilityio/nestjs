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
    .filter(([, value]) => value)
    .map(([key]) => key);
