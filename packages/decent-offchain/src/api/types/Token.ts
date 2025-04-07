import { Address } from "./Common";

export enum TokenType {
  ERC20 = "ERC20",
  ERC721 = "ERC721",
  ERC1155 = "ERC1155",
}

export type Token = {
  address: Address;
  type: TokenType;
}
