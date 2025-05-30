import { decodeFunctionData } from 'viem';
import { and, eq } from 'drizzle-orm';
import { getContract } from '@/lib/etherscan';
import { db } from '@/db';
import { Transaction } from '@/db/schema/onchain';
import { contractTable } from '@/db/schema/offchain/contracts';

export async function decodeTxData(transaction: Transaction, chainId: number) {
  let contract = await db.query.contractTable.findFirst({
    where: and(eq(contractTable.address, transaction.to), eq(contractTable.chainId, chainId)),
  });

  // if not found, fetch from etherscan
  if (!contract?.abi) {
    contract = await getContract(transaction.to, chainId);
    if (!contract) throw new Error('Contract not found');
    await db.insert(contractTable).values({
      name: contract.name,
      address: transaction.to,
      chainId,
      abi: contract.abi,
    }).onConflictDoNothing();
  }
  if (!contract.abi) throw new Error('Contract ABI not found');

  let decoded;
  try {
    decoded = decodeFunctionData({
      abi: contract.abi,
      data: transaction.data as `0x${string}`,
    });
  } catch (error) {
    console.error(error);
  }
  return decoded;
}
