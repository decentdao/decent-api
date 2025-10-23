import { and, eq, inArray } from 'ponder';
import { ponder } from 'ponder:registry';
import { votingStrategy, votingToken, vote } from 'ponder:schema';
import { setProposalEndBlock } from './utils/endBlock';
import { Address } from 'viem';

ponder.on('LinearERC721Voting:ProposalInitialized', async ({ event }) => {
  setProposalEndBlock(event); // cache votingEndBlock
});

ponder.on('LinearERC721Voting:GovernanceTokenAdded', async ({ event, context }) => {
  try {
    const { token, weight } = event.args;
    const strategy = event.log.address;
    await context.db
      .insert(votingToken)
      .values({
        address: token,
        votingStrategyId: strategy,
        type: 'ERC721',
        weight,
      })
      .onConflictDoNothing();
  } catch (e) {
    // console.error('LinearERC721Voting:GovernanceTokenAdded', e);
  }
});

ponder.on('LinearERC721Voting:GovernanceTokenRemoved', async ({ event, context }) => {
  try {
    const { token } = event.args;
    const votingStrategyId = event.log.address;
    await context.db.delete(votingToken, { address: token, votingStrategyId });
  } catch (e) {
    // console.error('LinearERC721Voting:GovernanceTokenRemoved', e);
  }
});

ponder.on('LinearERC721Voting:ProposerThresholdUpdated', async ({ event, context }) => {
  try {
    const { proposerThreshold } = event.args;
    const strategy = event.log.address;
    await context.db
      .insert(votingStrategy)
      .values({
        address: strategy,
        requiredProposerWeight: proposerThreshold,
      })
      .onConflictDoUpdate({ requiredProposerWeight: proposerThreshold });
  } catch (e) {
    // console.error('LinearERC721Voting:ProposerThresholdUpdated', e);
  }
});

ponder.on('LinearERC721Voting:QuorumThresholdUpdated', async ({ event, context }) => {
  try {
    const { quorumThreshold } = event.args;
    const strategy = event.log.address;
    await context.db
      .insert(votingStrategy)
      .values({
        address: strategy,
        quorumNumerator: quorumThreshold,
      })
      .onConflictDoUpdate({ quorumNumerator: quorumThreshold });
  } catch (e) {
    // console.error('LinearERC721Voting:QuorumThresholdUpdated', e);
  }
});

ponder.on('LinearERC721Voting:Voted', async ({ event, context }) => {
  try {
    const { voter, proposalId, voteType, tokenAddresses, tokenIds } = event.args;
    const votingStrategyAddress = event.log.address;
    const votedAt = event.block.timestamp;

    // Get all token weights for the NFT collections used in this vote
    const tokens = await context.db.sql
      .select()
      .from(votingToken)
      .where(
        and(
          eq(votingToken.votingStrategyId, votingStrategyAddress),
          inArray(votingToken.address, [...tokenAddresses]),
        ),
      );

    // Calculate total weight from all NFTs voted with
    // Build a map for O(1) lookups, then sum weights for each NFT
    const tokenWeightMap = new Map(tokens.map(t => [t.address, t.weight || 0n]));
    const weight = tokenAddresses
      .map(addr => addr.toLowerCase())
      .reduce((sum, address) => sum + (tokenWeightMap.get(address as Address) || 0n), 0n);

    await context.db
      .insert(vote)
      .values({
        voter,
        proposalId: BigInt(proposalId),
        votingStrategyAddress,
        voteType,
        weight,
        votedAt,
        tokenIds: [...tokenIds],
        tokenAddresses: [...tokenAddresses],
      })
      .onConflictDoUpdate({ weight });
  } catch (e) {
    // console.error('LinearERC721Voting:Voted');
  }
});
