export const hatIdToTreeId = (hatId: bigint | string) => {
  return Number(BigInt(hatId) >> 224n);
}

export function checkAdminHat(hatId: bigint): boolean {
  const level1 = (hatId >> 208n) & 0xFFFFn;
  const level2 = (hatId >> 192n) & 0xFFFFn;

  // Admin hat: has level1 set, but NO level2
  return level1 !== 0n && level2 === 0n;
}
