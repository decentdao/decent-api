import { createConfig } from "ponder";
import { http } from "viem";
import { KeyValuePairsAbi } from "./abis/KeyValuePairsAbi";

export default createConfig({
  networks: {
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
    optimism: {
      chainId: 10,
      transport: http(process.env.PONDER_RPC_URL_10),
    },
    polygon: {
      chainId: 137,
      transport: http(process.env.PONDER_RPC_URL_137),
    },
  },
  contracts: {
    KeyValuePairs: {
      abi: KeyValuePairsAbi,
      network: {
        sepolia: {
          address: "0xC0E08581b70cF745770154f3E9a9A8890198b024",
          startBlock: 4916643,
        },
        mainnet: {
          address: "0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131",
          startBlock: 17389311,
        },
        base: {
          address: "0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131",
          startBlock: 12996645,
        },
        optimism: {
          address: "0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131",
          startBlock: 118640420,
        },
        polygon: {
          address: "0x68e3b985B93eA0a10178c7ae919299699559Aaab",
          startBlock: 43952879,
        },
      },
    },
  },
});
