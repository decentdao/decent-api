export const unixTimestamp = (date?: Date | null): number => {
  if (!date) {
    const now = new Date();
    return Math.floor(now.getTime() / 1000);
  }
  return Math.floor(date.getTime() / 1000);
};
