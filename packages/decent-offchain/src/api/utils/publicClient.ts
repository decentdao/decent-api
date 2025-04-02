import { mainnet } from 'viem/chains';
import { createPublicClient, http } from 'viem';

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.PONDER_RPC_URL_1),
});
