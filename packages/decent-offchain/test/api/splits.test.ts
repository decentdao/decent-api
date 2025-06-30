import { beforeAll, describe, it, expect } from 'bun:test';
import { Address } from 'viem';
import app from '@/api/index';
import { ApiResponse, Split } from 'decent-sdk';
import { db } from '@/db';
import { schema } from '@/db/schema';
import { daoChainId, daoAddress } from 'test/constants';

// Test constants
const splitAddress = '0x0000000000000000000000000000000000000101' as Address;
const recipient1 = '0x000000000000000000000000000000000000a001' as Address;
const recipient2 = '0x000000000000000000000000000000000000a002' as Address;

beforeAll(async () => {
  // Seed a split and two recipients for the primary test DAO.
  await db
    .insert(schema.splitTable)
    .values({
      daoChainId,
      daoAddress,
      address: splitAddress,
      name: 'Test Split',
    })
    .onConflictDoNothing();

  // Insert recipients (use two separate calls to make onConflictDoNothing() simple)
  await db
    .insert(schema.splitRecipientTable)
    .values({
      splitAddress,
      recipientAddress: recipient1,
      percentage: 60,
    })
    .onConflictDoNothing();

  await db
    .insert(schema.splitRecipientTable)
    .values({
      splitAddress,
      recipientAddress: recipient2,
      percentage: 40,
    })
    .onConflictDoNothing();
});

describe('Splits API', () => {
  it('GET splits for an existing DAO', async () => {
    const res = await app.request(`/d/${daoChainId}/${daoAddress}/splits`);
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as ApiResponse<Split[]>;
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect((data as Split[]).length).toBeGreaterThan(0);

    // Locate the split we seeded
    const seeded = (data as Split[]).find(
      (s: Split) => s.address.toLowerCase() === splitAddress.toLowerCase(),
    );
    expect(seeded).toBeDefined();
    expect(seeded?.splits.length).toBe(2);
    const percentages = seeded?.splits.map((r: { percentage: number }) => r.percentage).sort();
    expect(percentages).toEqual([40, 60]);
  });

  it('GET splits for a non-existent DAO returns 404', async () => {
    const res = await app.request(
      `/d/${daoChainId}/0x000000000000000000000000000000000000dead/splits`,
    );
    expect(res.status).toBe(404);
  });
});
