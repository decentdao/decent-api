import { Transaction } from '@/db/schema/onchain';
import { Address, isAddress, checksumAddress } from 'viem';

export function decodeMultiSendTransactions(hex: string): Transaction[] {
  if (hex.startsWith('0x')) hex = hex.slice(2);

  const transactions: Transaction[] = [];
  let cursor = 0;

  while (cursor < hex.length) {
    // 1. operation (1 byte = 2 hex chars)
    const operation = parseInt(hex.slice(cursor, cursor + 2), 16);
    cursor += 2;

    // 2. to (20 bytes = 40 hex chars)
    const toRaw = '0x' + hex.slice(cursor, cursor + 40);
    const to = isAddress(toRaw) ? checksumAddress(toRaw) : toRaw;
    cursor += 40;

    // 3. value (32 bytes = 64 hex chars)
    const value = BigInt('0x' + hex.slice(cursor, cursor + 64));
    cursor += 64;

    // 4. data length (32 bytes = 64 hex chars)
    const dataLength = parseInt(hex.slice(cursor, cursor + 64), 16);
    cursor += 64;

    // 5. data (dataLength bytes = dataLength * 2 hex chars)
    const data = dataLength > 0 ? '0x' + hex.slice(cursor, cursor + dataLength * 2) : '0x';
    cursor += dataLength * 2;

    console.log(
      `Decoded transaction: operation=${operation}, to=${to}, value=${value}, data=${data}`,
    );

    transactions.push({ operation, to: to as Address, value, data });
  }

  return transactions;
}
