import { Context, Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { Address, isAddress, toFunctionSelector } from 'viem';
import { db } from '@/db';
import { schema } from '@/db/schema';
import resf, { ApiError } from '@/api/utils/responseFormatter';

const app = new Hono();

// simple function selectors for now
const functionSelectors = {
  disperseToken: toFunctionSelector('disperseToken(address,address[],uint256[])'),
};

type FunctionSelector = keyof typeof functionSelectors;

const checkDataForFunction = (data: string, selector: FunctionSelector) => {
  const functionSelector = functionSelectors[selector];
  return data.startsWith(functionSelector);
};

const getProposalsByAuthor = async ({
  address,
  passed,
}: {
  address: Address;
  passed?: boolean;
}) => {
  const [onchainProposals, safeProposals] = await Promise.all([
    db.query.onchainProposalTable.findMany({
      where: passed
        ? sql`LOWER(${schema.onchainProposalTable.proposer}) = ${address} AND ${schema.onchainProposalTable.executedTxHash} IS NOT NULL`
        : sql`LOWER(${schema.onchainProposalTable.proposer}) = ${address}`,
    }),
    db.query.safeProposalTable.findMany({
      where: passed
        ? sql`LOWER(${schema.safeProposalTable.proposer}) = ${address} AND ${schema.safeProposalTable.executedTxHash} IS NOT NULL`
        : sql`LOWER(${schema.safeProposalTable.proposer}) = ${address}`,
    }),
  ]);
  return {
    onchainProposals,
    safeProposals,
  };
};

const checkAddress = async (c: Context) => {
  const _address = c.req.query('address');
  if (!_address) throw new ApiError('Address is required', 400);
  const valid = isAddress(_address);
  if (!valid) throw new ApiError('Invalid address', 400);
  const address = _address.toLowerCase() as Address;
  return address;
};

/**
 * @title Get the number of proposals that an address has submitted
 * @route GET /points/proposals
 * @param {string} address - Address parameter
 * @param {boolean} passed - Whether to filter for passed proposals
 * @returns {address, proposalCount} - The address and the number of proposals that the address has submitted
 */
app.get('/proposals', async c => {
  const address = await checkAddress(c);
  const passed = c.req.query('passed') === 'true';
  const { onchainProposals, safeProposals } = await getProposalsByAuthor({ address, passed });
  const proposalCount = onchainProposals.length + safeProposals.length;
  return resf(c, { address, proposalCount });
});

app.get('/disperses', async c => {
  const address = await checkAddress(c);
  const { onchainProposals, safeProposals } = await getProposalsByAuthor({ address, passed: true });

  const hasOnchainDisperseProposal = onchainProposals.filter(proposal =>
    proposal.transactions?.find(transaction =>
      checkDataForFunction(transaction.data, 'disperseToken'),
    ),
  ).length;

  const hasSafeDisperseProposal = safeProposals.filter(proposal =>
    proposal?.transactions?.parameters?.find(parameter =>
      parameter.valueDecoded?.find(value => checkDataForFunction(value.data, 'disperseToken')),
    ),
  ).length;

  const disperseCount = hasOnchainDisperseProposal + hasSafeDisperseProposal;

  return resf(c, { address, disperseCount });
});

export default app;
