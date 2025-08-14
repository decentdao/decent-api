const IPFS_GATEWAY = 'https://nance.infura-ipfs.io';

export async function fetchMetadata(cid: string) {
  const response = await fetch(`${IPFS_GATEWAY}/ipfs/${cid}`);
  const data = (await response.json()) as { title: string; description: string };
  return data;
}
