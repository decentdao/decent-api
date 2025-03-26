import { Context } from "ponder:registry";
import { Address } from "viem";
import { abis } from "@fractal-framework/fractal-contracts";
import {
  getPages,
  SENTINEL_ADDRESS,
  PAGE_SIZE,
} from "./common";

export async function getStrategyFromModule(context: Context, moduleAddress: Address) {
  try { 
    const [
      _domainSeparatorTypeHash,
      _transactionTypeHash,
      _avatar,
      strategiesResponse
    ] = await context.client.multicall({
      contracts: [
        // add FractalModule stuff here too
        {
          abi: abis.Azorius,
          address: moduleAddress,
          functionName: "DOMAIN_SEPARATOR_TYPEHASH",
        },
        {
          abi: abis.Azorius,
          address: moduleAddress,
          functionName: "TRANSACTION_TYPEHASH",
        },
        {
          abi: abis.Azorius,
          address: moduleAddress,
          functionName: "avatar",
        },
        {
          abi: abis.Azorius,
          address: moduleAddress,
          functionName: "getStrategies",
          args: [SENTINEL_ADDRESS, PAGE_SIZE],
        },
      ],
      allowFailure: false,
    });

    const strategies: Address[] = [];
    if (strategiesResponse[0].length < PAGE_SIZE) {
      strategies.push(...strategiesResponse[0]);
    } else {
      const moreStrategies = await getPages(context, moduleAddress, "Azorius", "getStrategies");
      strategies.push(...moreStrategies);
    }

    return strategies;
  } catch (error) {
    // if multicall fails, it's probably not an Azorius module
    return null;
  }
}
