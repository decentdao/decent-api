import { DbRole, RoleDetails } from '@/db/schema';
import { unixTimestamp } from './time';
import { ipfsCacheFetch } from './ipfs';

export async function formatRoles(roles: DbRole[]) {
  const now = unixTimestamp();

  return Promise.all(
    roles.map(async r => {
      const { detailsCID, detailsCache, ...role } = r;

      let details = detailsCache?.data;
      if (!details && detailsCID) {
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
