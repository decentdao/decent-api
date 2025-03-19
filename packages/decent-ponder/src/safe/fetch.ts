import { Context } from "ponder:registry";
import { GnosisSafeL2Abi } from "../../abis/GnosisSafeL2";
import { Address, getAddress, zeroAddress } from "viem";

const SENTINEL_ADDRESS = "0x0000000000000000000000000000000000000001";
const GUARD_STORAGE_SLOT = "0x3a"; // Slot defined in Safe contracts (could vary)

// https://github.com/decentdao/decent-app/blob/develop/src/providers/App/hooks/useSafeAPI.ts#L155
export async function fetchSafe(context: Context, safeAddress: Address) {
  try {
    const [nonce, threshold, owners, version] = await context.client.multicall({
      contracts: [
        {
          abi: GnosisSafeL2Abi,
          address: safeAddress,
          functionName: "nonce",
        },
        {
          abi: GnosisSafeL2Abi,
          address: safeAddress,
          functionName: "getThreshold",
        },
        {
          abi: GnosisSafeL2Abi,
          address: safeAddress,
          functionName: "getOwners",
        },
        {
          abi: GnosisSafeL2Abi,
          address: safeAddress,
          functionName: "VERSION",
        },
      ],
      allowFailure: false,
    });

    const guardStorageValue = await context.client.getStorageAt({
      address: safeAddress,
      slot: GUARD_STORAGE_SLOT,
    });

    // Fetch modules
    let startAddress: Address = SENTINEL_ADDRESS;
    let nextAddress: Address =  zeroAddress; // placeholder
    const allModules: Address[] = [];

    while (nextAddress !== SENTINEL_ADDRESS) {
      const lastModuleResponse = await context.client.readContract({
        address: safeAddress,
        abi: GnosisSafeL2Abi,
        functionName: "getModulesPaginated",
        args: [startAddress, 10n], // get 10 modules per page
      });
      const pageOfModules = lastModuleResponse[0]; // one page of modules
      const next = lastModuleResponse[1]; // cursor for next page

      // a Safe might not have any modules installed
      if (pageOfModules.length > 0) {
        allModules.push(...pageOfModules);
      }

      nextAddress = next;
      startAddress = nextAddress;
    }

    return {
      address: safeAddress,
      nonce: Number(nonce ? nonce : 0),
      threshold: Number(threshold ? threshold : 0),
      owners: owners as string[],
      modules: allModules,
      guard: guardStorageValue ? getAddress(`0x${guardStorageValue.slice(-40)}`) : zeroAddress,
      version: version,
    };
  } catch (error) {
    throw new Error(`Failed to fetch safe: ${safeAddress}`);
  }
}
