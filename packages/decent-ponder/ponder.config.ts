import { createConfig } from "ponder";
import { http } from "viem";
import { KeyValuePairsAbi } from "./abis/KeyValuePairsAbi";
import { FractalRegistryAbi } from "./abis/FractalRegistry";

export default createConfig({
  networks: {
    // sepolia: {
    //   chainId: 11155111,
    //   transport: http(process.env.PONDER_RPC_URL_11155111),
    // },
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
    // optimism: {
    //   chainId: 10,
    //   transport: http(process.env.PONDER_RPC_URL_10),
    // },
    // polygon: {
    //   chainId: 137,
    //   transport: http(process.env.PONDER_RPC_URL_137),
    // },
  },
  contracts: {
    KeyValuePairs: {
      abi: KeyValuePairsAbi,
      network: {
        // sepolia: {
        //   address: "0xC0E08581b70cF745770154f3E9a9A8890198b024",
        //   startBlock: 4916643,
        // },
        mainnet: {
          address: "0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131",
          startBlock: 17389311,
        },
        base: {
          address: "0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131",
          startBlock: 12996645,
        },
        // optimism: {
        //   address: "0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131",
        //   startBlock: 118640420,
        // },
        // polygon: {
        //   address: "0x68e3b985B93eA0a10178c7ae919299699559Aaab",
        //   startBlock: 43952879,
        // },
      },
    },
    FractalRegistry: {
      abi: FractalRegistryAbi,
      network: {
        // sepolia: {
        //   address: "0x4791FF2a6E84F012402c0679C12Cb1d9260450A6",
        //   startBlock: 4916634,
        // },
        mainnet: {
          address: "0x023BDAEFeDDDdd5B43aF125CAA8007a99A886Fd3",
          startBlock: 17389302,
        },
        base: {
          address: "0x023bdaefeddddd5b43af125caa8007a99a886fd3",
          startBlock: 12996617,
        },
        // optimism: {
        //   address: "0x023BDAEFeDDDdd5B43aF125CAA8007a99A886Fd3",
        //   startBlock: 118640391,
        // },
        // polygon: {
        //   address: "0xfE5950B4975a19679be7c31a0A03D626d237f37C",
        //   startBlock: 43952847,
        // },
      },
    },
  },
});
