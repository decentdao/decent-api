/**
 * Converts input to Unix timestamp in seconds
 * @param input - Date object, timestamp in seconds/milliseconds, or null/undefined for current time
 * @returns Unix timestamp in seconds
 */
export const unixTimestamp = (input?: Date | number | null): number => {
  if (!input) {
    const now = new Date();
    return Math.floor(now.getTime() / 1000);
  }
  if (typeof input === 'number') {
    // Convert milliseconds to seconds if needed
    return input > 1e10 ? Math.floor(input / 1000) : input;
  }
  return Math.floor(input.getTime() / 1000);
};
