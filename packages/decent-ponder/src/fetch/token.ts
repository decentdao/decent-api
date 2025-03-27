import { abis } from "@fractal-framework/fractal-contracts";
import { Context } from "ponder:registry";
import { Address } from "viem";

export type Token = {
  type: "ERC20" | "ERC721";
  addresses: Address[];
};

export async function getTokenFromStrategy(
  context: Context,
  strategyAddress: Address,
): Promise<Token | null> {
  const [
    ERC20Token,
    ERC721Token,
  ] = await context.client.multicall({
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

  if (ERC20Token.status === "success" && ERC20Token.result) {
    return {
      type: "ERC20",
      addresses: [ERC20Token.result],
    };
  }

  if (ERC721Token.status === "success" && ERC721Token.result) {
    return {
      type: "ERC721",
      addresses: [...ERC721Token.result],
    };
  }

  return null;
}
