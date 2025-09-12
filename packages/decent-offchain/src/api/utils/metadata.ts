import { IPFS_GATEWAY } from './ipfs';

export async function fetchMetadata(cid: string) {
  const response = await fetch(`${IPFS_GATEWAY}/ipfs/${cid}`);
  const data = (await response.json()) as { title: string; description: string };
  return data;
}
