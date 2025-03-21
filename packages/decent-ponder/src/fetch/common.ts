import { Context } from "ponder:registry";
import { Address, getAddress, zeroAddress } from "viem";
import { abis } from "@fractal-framework/fractal-contracts";
import { GnosisSafeL2Abi } from "../../abis/GnosisSafeL2";

export const SENTINEL_ADDRESS: Address = "0x0000000000000000000000000000000000000001";
export const GUARD_STORAGE_SLOT = "0x3a"; // Slot defined in Safe contracts (could vary)
export const PAGE_SIZE = 10n;

export async function getPages(
  context: Context,
  address: Address,
  contract: "Azorius" | "GnosisSafeL2",
  functionName: "getStrategies" | "getModulesPaginated",
): Promise<Address[]> {
  const abi = contract === "Azorius" ? abis.Azorius : GnosisSafeL2Abi;
  let startAddress: Address = SENTINEL_ADDRESS;
  let nextAddress: Address = zeroAddress;
  let results: Address[] = [];

  while (nextAddress !== SENTINEL_ADDRESS) {
    const response = await context.client.readContract({
      address,
      abi,
      functionName,
      args: [startAddress, PAGE_SIZE],
    });
    results.push(...response[0]);
    nextAddress = response[1];
    startAddress = nextAddress;
  }
  
  return results;
}
