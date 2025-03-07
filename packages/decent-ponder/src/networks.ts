export const chainIdToPrefix = (chainId: number) => {
  if (chainId === 11155111) {
    return "sep";
  } else if (chainId === 1) {
    return "eth";
  } else if (chainId === 8453) {
    return "base";
  } else if (chainId === 10) {
    return "opt";
  } else if (chainId === 137) {
    return "matic";
  }
};
