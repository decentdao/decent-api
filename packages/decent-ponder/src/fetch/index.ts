import { Address, getAddress, zeroAddress } from "viem";
import { Context } from "ponder:registry";
import { GnosisSafeL2Abi } from "../../abis/GnosisSafeL2";
import { getStrategyFromModule } from "./strategy";
import {
  getPages,
  SENTINEL_ADDRESS,
  GUARD_STORAGE_SLOT,
  PAGE_SIZE,
} from "./common";
import { getTokenFromStrategy, Token } from "./token";

// https://github.com/decentdao/decent-app/blob/develop/src/providers/App/hooks/useSafeAPI.ts#L155
export async function fetchGovernance(context: Context, safeAddress: Address) {
  try {
    const [nonce, threshold, owners, version, modulesResponse] = await context.client.multicall({
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
        {
          abi: GnosisSafeL2Abi,
          address: safeAddress,
          functionName: "getModulesPaginated",
          args: [SENTINEL_ADDRESS, PAGE_SIZE],
        },
      ],
      allowFailure: false,
    });

    const guardStorageValue = await context.client.getStorageAt({
      address: safeAddress,
      slot: GUARD_STORAGE_SLOT,
    });

    const modules: Address[] = [];
    if (modulesResponse[0].length < PAGE_SIZE) {
      modules.push(...modulesResponse[0]);
    } else {
      const moreModules = await getPages(context, safeAddress, "GnosisSafeL2", "getModulesPaginated");
      modules.push(...moreModules);
    }

    const strategies = modules.length > 0
      ? (await Promise.all(
          modules.map(module => getStrategyFromModule(context, module))
        )).filter(strategy => !!strategy).flat()
      : null;

    const tokens = strategies 
      ? (await Promise.all(
          strategies.map(strategy => getTokenFromStrategy(context, strategy.addresses[0]))
        )).filter(token => !!token)
      : null;

    return {
      address: safeAddress,
      nonce: Number(nonce ? nonce : 0),
      threshold: Number(threshold ? threshold : 0),
      owners: owners as Address[],
      modules,
      strategies,
      tokens,
      guard: guardStorageValue ? getAddress(`0x${guardStorageValue.slice(-40)}`) : zeroAddress,
      version,
    };
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to fetch safe: ${safeAddress}`);
  }
}
