import { createConfig, factory } from 'ponder';
import { getAbiItem, http } from 'viem';
import { KeyValuePairsAbi } from './abis/KeyValuePairsAbi';
import { FractalRegistryAbi } from './abis/FractalRegistryAbi';
import { AzoriusAbi } from './abis/AzoriusAbi';
import { LinearERC20VotingAbi } from './abis/LinearERC20VotingAbi';
import { ZodiacModuleProxyFactoryAbi } from './abis/ZodiacModuleProxyFactoryAbi';
import { LinearERC721VotingAbi } from './abis/LinearERC721VotingAbi';
import { MultisigFreezeGuardAbi } from './abis/MultisigFreezeGuardAbi';
import { MultisigFreezeVotingAbi } from './abis/MultisigFreezeVotingAbi';
import { AzoriusFreezeGuardAbi } from './abis/AzoriusFreezeGuardAbi';
import { FractalModuleAbi } from './abis/FractalModuleAbi';
import { ERC20FreezeVotingAbi } from './abis/ERC20FreezeVotingAbi';
import { ERC721FreezeVotingAbi } from './abis/ERC721FreezeVotingAbi';
import { SplitV2o2FactoryAbi } from './abis/SplitV2o2FactoryAbi';
import { SplitV2Abi } from './abis/SplitV2Abi';
import { HatsAbi } from './abis/HatsAbi';
import { HatsElectionEligibilityAbi } from './abis/HatsElectionEligibilityAbi';
import { HatsModuleFactoryAbi } from './abis/HatsModuleFactoryAbi';

export default createConfig({
  chains: {
    mainnet: {
      id: 1,
      rpc: http(process.env.PONDER_RPC_URL_1),
    },
    base: {
      id: 8453,
      rpc: http(process.env.PONDER_RPC_URL_8453),
    },
    optimism: {
      id: 10,
      rpc: http(process.env.PONDER_RPC_URL_10),
    },
    polygon: {
      id: 137,
      rpc: http(process.env.PONDER_RPC_URL_137),
    },
    sepolia: {
      id: 11155111,
      rpc: http(process.env.PONDER_RPC_URL_11155111),
    },
  },
  contracts: {
    KeyValuePairs: {
      abi: KeyValuePairsAbi,
      chain: {
        mainnet: {
          address: '0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131',
          startBlock: 17389311,
        },
        base: {
          address: '0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131',
          startBlock: 12996645,
        },
        optimism: {
          address: '0x535B64f9Ef529Ac8B34Ac7273033bBE67B34f131',
          startBlock: 118640420,
        },
        polygon: {
          address: '0x68e3b985B93eA0a10178c7ae919299699559Aaab',
          startBlock: 43952879,
        },
        sepolia: {
          address: '0xC0E08581b70cF745770154f3E9a9A8890198b024',
          startBlock: 4916643,
        },
      },
    },
    FractalRegistry: {
      abi: FractalRegistryAbi,
      chain: {
        mainnet: {
          address: '0x023BDAEFeDDDdd5B43aF125CAA8007a99A886Fd3',
          startBlock: 17389302,
        },
        base: {
          address: '0x023bdaefeddddd5b43af125caa8007a99a886fd3',
          startBlock: 12996617,
        },
        optimism: {
          address: '0x023BDAEFeDDDdd5B43aF125CAA8007a99A886Fd3',
          startBlock: 118640391,
        },
        polygon: {
          address: '0xfE5950B4975a19679be7c31a0A03D626d237f37C',
          startBlock: 43952847,
        },
        sepolia: {
          address: '0x4791FF2a6E84F012402c0679C12Cb1d9260450A6',
          startBlock: 4916634,
        },
      },
    },
    Azorius: {
      abi: AzoriusAbi,
      chain: {
        mainnet: {
          startBlock: 17389307,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996633,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640408,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    FractalModule: {
      abi: FractalModuleAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916633,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    LinearERC20Voting: {
      abi: LinearERC20VotingAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    LinearERC721Voting: {
      abi: LinearERC721VotingAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    MultisigFreezeGuard: {
      abi: MultisigFreezeGuardAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    AzoriusFreezeGuard: {
      abi: AzoriusFreezeGuardAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952861,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    MultisigFreezeVoting: {
      abi: MultisigFreezeVotingAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    ERC20FreezeVoting: {
      abi: ERC20FreezeVotingAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    ERC721FreezeVoting: {
      abi: ERC721FreezeVotingAbi,
      chain: {
        mainnet: {
          startBlock: 17389302,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        base: {
          startBlock: 12996617,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        optimism: {
          startBlock: 118640391,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0x31Bf73048056fe947B827C0Fe159ACcB5Ae30237',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        polygon: {
          startBlock: 43952847,
          address: factory({
            address: '0x000000000000aDdB49795b0f9bA5BC298cDda236',
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
        sepolia: {
          startBlock: 4916642,
          address: factory({
            address: [
              '0x000000000000aDdB49795b0f9bA5BC298cDda236',
              '0xE93e4B198097C4CB3A6de594c90031CDaC0B88f3',
            ],
            event: getAbiItem({ abi: ZodiacModuleProxyFactoryAbi, name: 'ModuleProxyCreation' }),
            parameter: 'proxy',
          }),
        },
      },
    },
    SplitV2: {
      abi: SplitV2Abi,
      chain: {
        mainnet: {
          startBlock: 22870483,
          address: factory({
            address: '0x8E8eB0cC6AE34A38B67D5Cf91ACa38f60bc3Ecf4',
            event: getAbiItem({ abi: SplitV2o2FactoryAbi, name: 'SplitCreated' }),
            parameter: 'split',
          }),
        },
        base: {
          startBlock: 32572184,
          address: factory({
            address: '0x8E8eB0cC6AE34A38B67D5Cf91ACa38f60bc3Ecf4',
            event: getAbiItem({ abi: SplitV2o2FactoryAbi, name: 'SplitCreated' }),
            parameter: 'split',
          }),
        },
        optimism: {
          startBlock: 138165378,
          address: factory({
            address: '0x8E8eB0cC6AE34A38B67D5Cf91ACa38f60bc3Ecf4',
            event: getAbiItem({ abi: SplitV2o2FactoryAbi, name: 'SplitCreated' }),
            parameter: 'split',
          }),
        },
        polygon: {
          startBlock: 73707056,
          address: factory({
            address: '0x8E8eB0cC6AE34A38B67D5Cf91ACa38f60bc3Ecf4',
            event: getAbiItem({ abi: SplitV2o2FactoryAbi, name: 'SplitCreated' }),
            parameter: 'split',
          }),
        },
        sepolia: {
          startBlock: 8715311,
          address: factory({
            address: '0x8E8eB0cC6AE34A38B67D5Cf91ACa38f60bc3Ecf4',
            event: getAbiItem({ abi: SplitV2o2FactoryAbi, name: 'SplitCreated' }),
            parameter: 'split',
          }),
        },
      },
    },
    Hats: {
      abi: HatsAbi,
      chain: {
        mainnet: {
          startBlock: 21130150,
          address: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
        },
        base: {
          startBlock: 22747340,
          address: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
        },
        optimism: {
          startBlock: 128342611,
          address: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
        },
        polygon: {
          startBlock: 64597158,
          address: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
        },
        sepolia: {
          startBlock: 7129765,
          address: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
        },
      },
    },
    HatsElectionEligibility: {
      abi: HatsElectionEligibilityAbi,
      chain: {
        mainnet: {
          startBlock: 19467227,
          address: factory({
            address: '0x0a3f85fa597B6a967271286aA0724811acDF5CD9',
            event: getAbiItem({
              abi: HatsModuleFactoryAbi,
              name: 'HatsModuleFactory_ModuleDeployed',
            }),
            parameter: 'instance',
          }),
        },
        base: {
          startBlock: 12021817,
          address: factory({
            address: '0x0a3f85fa597B6a967271286aA0724811acDF5CD9',
            event: getAbiItem({
              abi: HatsModuleFactoryAbi,
              name: 'HatsModuleFactory_ModuleDeployed',
            }),
            parameter: 'instance',
          }),
        },
        optimism: {
          startBlock: 117616123,
          address: factory({
            address: '0x0a3f85fa597B6a967271286aA0724811acDF5CD9',
            event: getAbiItem({
              abi: HatsModuleFactoryAbi,
              name: 'HatsModuleFactory_ModuleDeployed',
            }),
            parameter: 'instance',
          }),
        },
        polygon: {
          startBlock: 54831711,
          address: factory({
            address: '0x0a3f85fa597B6a967271286aA0724811acDF5CD9',
            event: getAbiItem({
              abi: HatsModuleFactoryAbi,
              name: 'HatsModuleFactory_ModuleDeployed',
            }),
            parameter: 'instance',
          }),
        },
        sepolia: {
          startBlock: 5516083,
          address: factory({
            address: '0x0a3f85fa597B6a967271286aA0724811acDF5CD9',
            event: getAbiItem({
              abi: HatsModuleFactoryAbi,
              name: 'HatsModuleFactory_ModuleDeployed',
            }),
            parameter: 'instance',
          }),
        },
      },
    },
  },
});
