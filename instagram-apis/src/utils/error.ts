export const toError = (value: unknown) => {
  if (value instanceof Error) return value;

  const message = typeof value === 'string'
    ? value
    : (() => {
        try {
            return JSON.stringify(value);
        } catch (error) {
            return 'Unserializable thrown value';
        }
    })();

  return new Error(`Non-Error thrown: ${message}`);
}
