import { abis } from "@fractal-framework/fractal-contracts";
import { Context } from "ponder:registry";
import { Address } from "viem";

export type Token = {
  type: "erc20" | "erc721";
  addresses: Address[];
};

export async function fetchTokenFromStrategy(
  context: Context,
  strategyAddress: Address,
): Promise<Token | null> {
  const [governanceToken, allTokenAddresses] = await context.client.multicall({
    contracts: [
      {
        address: strategyAddress,
        abi: abis.LinearERC20Voting,
        functionName: "governanceToken",
      },
      {
        address: strategyAddress,
        abi: abis.LinearERC721Voting,
        functionName: "getAllTokenAddresses",
      },
    ],
  });

  if (governanceToken.status === "success") {
    return {
      type: "erc20",
      addresses: [governanceToken.result] as Address[],
    };
  }

  if (allTokenAddresses.status === "success" && allTokenAddresses.result) {
    return {
      type: "erc721",
      addresses: allTokenAddresses.result as Address[],
    };
  }

  return null;
}
