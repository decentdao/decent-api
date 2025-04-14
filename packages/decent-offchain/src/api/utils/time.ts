export const unixTimestamp = (date?: Date | null): number => {
  if (!date) return 0;
  return Math.floor(date.getTime() / 1000);
};
