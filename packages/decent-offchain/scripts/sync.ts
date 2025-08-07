import { sleep } from 'bun';
import { Dao, ApiResponse, Proposal } from 'decent-sdk';

// const API = 'http://localhost:3005';
const API = 'https://api.decent.build';

export async function sync() {
  const startTime = Date.now();
  const f = (await fetch(`${API}/d`).then(r => r.json())) as {
    data: (Dao & { governanceModuleExists: boolean })[];
  };
  const daos = f.data.filter(d => !d.governanceModuleExists); // multisig DAOs
  let proposalsAdded = 0;
  for (let i = 0; i < daos.length; i++) {
    const dao = daos[i];
    if (!dao) continue;
    console.log(`[${i + 1}/${daos.length}] Syncing ${dao.address} on ${dao.chainId}`);
    const res = (await fetch(`${API}/d/${dao.chainId}/${dao.address}/safe-proposals`, {
      method: 'POST',
    }).then(r => r.json())) as ApiResponse<Proposal[]>;
    proposalsAdded += res?.data?.length ?? 0;
    if (res.error) {
      console.error(res.error.message);
      continue;
    }
    await sleep(100);
  }

  const endTime = Date.now();
  console.log(`Total sync time: ${(endTime - startTime) / 1000}s`);
  console.log(`Total proposals added: ${proposalsAdded}`);
}

sync();
