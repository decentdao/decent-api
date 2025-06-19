export function filterTokenSymbols(symbols: string[]): string[] {
  return symbols.filter(symbol => {
    if (!/^[\u0020-\u007F]*$/.test(symbol)) {
      return false;
    }
    return true;
  });
}
