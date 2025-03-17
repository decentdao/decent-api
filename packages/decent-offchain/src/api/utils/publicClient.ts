import { createPublicClient, http } from "viem";

export const publicClient = createPublicClient({
  transport: http(process.env.PONDER_RPC_URL_1),
});
