import { DbRole } from '@/db/schema/onchain';
import { unixTimestamp } from './time';
import { ipfsCacheFetch } from './ipfs';

type RoleDetails = {
  type: string;
  data: {
    name: string;
    description: string;
  };
};

export async function formatRoles(roles: DbRole[]) {
  const now = unixTimestamp();

  return Promise.all(
    roles.map(async r => {
      const { detailsCID, ...role } = r;

      let details: RoleDetails | undefined;
      if (detailsCID) {
        details = (await ipfsCacheFetch(detailsCID)) as RoleDetails;
      }

      return {
        name: details?.data.name,
        description: details?.data.description,
        detailsCID,
        ...role,
        terms: role.terms?.map(term => ({
          ...term,
          active: term.termEnd >= now,
        })),
      };
    }),
  );
}
