import { Context } from "ponder:registry";
import { Address, zeroAddress } from "viem";
import { abis } from "@fractal-framework/fractal-contracts";
import {
  getPages,
  SENTINEL_ADDRESS,
  PAGE_SIZE,
} from "./common";

export type Strategy = {
  type: "Azorius" | "FractalModule";
  address: Address;
};

export async function getStrategyFromModule(context: Context, moduleAddress: Address) {
  try { 
    const [
      domainSeparatorTypeHash,
      transactionTypeHash,
      strategiesResponse,
      fractalModuleAddress,
    ] = await context.client.multicall({
      contracts: [
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
          functionName: "getStrategies",
          args: [SENTINEL_ADDRESS, PAGE_SIZE],
        },
        {
          abi: abis.FractalModule,
          address: moduleAddress,
          functionName: "avatar",
        },
      ],
      allowFailure: true,
    });

    // Azorius
    if (
      domainSeparatorTypeHash.status === "success" &&
      transactionTypeHash.status === "success" &&
      strategiesResponse.status === "success"
    ) {
      const strategies = strategiesResponse.result[0];
      if (strategies.length < PAGE_SIZE) {
        // TODO check token type
      } else {
        const moreStrategies = await getPages(context, moduleAddress, "Azorius", "getStrategies");
        return {
          type: "Azorius",
          addresses: [...strategies, ...moreStrategies],
        };
      }
    }

    // FractalModule on a subDAO
    if (fractalModuleAddress.status === "success" && fractalModuleAddress.result !== zeroAddress) {
      return {
        type: "FractalModule",
        addresses: [fractalModuleAddress.result],
      };
    }
  } catch (error) {
    // if multicall fails, it's probably not an Azorius module or FractalModule
    return null;
  }
}
