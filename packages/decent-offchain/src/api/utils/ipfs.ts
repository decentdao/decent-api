import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { schema } from '@/db/schema';

export const IPFS_GATEWAY = 'https://nance.infura-ipfs.io';

export async function ipfsCacheFetch(cid: string) {
  const cache = await db.query.ipfsTable.findFirst({
    where: eq(schema.ipfsTable.cid, cid),
  });

  if (!cache) {
    const response = await fetch(`${IPFS_GATEWAY}/ipfs/${cid}`);
    const data = await response.json();
    await db.insert(schema.ipfsTable).values({ cid, data });
    return data;
  }

  return cache.data;
}
