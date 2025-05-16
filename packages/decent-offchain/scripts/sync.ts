import { sleep } from 'bun';
import { Dao } from 'decent-sdk';

const API = 'http://localhost:3005';

export async function sync() {
  const f = await fetch(`${API}/d`).then(r => r.json()) as { data: Dao[] };
  const daos = f.data;

  for (let i = 0; i < daos.length; i++) {
    const dao = daos[i];
    if (!dao) continue;
    console.log(`Syncing ${dao.address} on ${dao.chainId}`);
    await fetch(`${API}/d/${dao.chainId}/${dao.address}/proposals/sync`).then(r => r.json());
    await sleep(200);
    console.log(`Synced ${dao.address} on ${dao.chainId}`);
  }
}

sync();
