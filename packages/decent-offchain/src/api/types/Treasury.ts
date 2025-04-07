import { Optional } from "./Common";

export type TokenBlance = {
  tokenAddress: string;
  balance: number;
  usdValue: number;
  portfolioPercentage: Optional<number>;
};

export type Treasury = {
  totalUsdValue: number;
  fungible: TokenBlance[]; // ERC20
  nonFungible: TokenBlance[]; // ERC721, ERC1155
};
