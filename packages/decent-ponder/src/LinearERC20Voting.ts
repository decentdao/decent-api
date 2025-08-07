import { ponder } from 'ponder:registry';
import { vote, votingStrategy, votingToken } from 'ponder:schema';
import { LinearERC20VotingAbi } from '../abis/LinearERC20Voting';

ponder.on('LinearERC20Voting:AzoriusSet', async ({ event, context }) => {
  try {
    const { azoriusModule } = event.args;
    const address = event.log.address;
    await context.db
      .insert(votingStrategy)
      .values({
        address,
        governanceModuleId: azoriusModule,
      })
      .onConflictDoUpdate({ governanceModuleId: azoriusModule });

    // no event for ERC20 voting token so do it manually here
    try {
      const token = await context.client.readContract({
        address,
        abi: LinearERC20VotingAbi,
        functionName: 'governanceToken',
      });
      await context.db
        .insert(votingToken)
        .values({
          address: token,
          type: 'ERC20',
          votingStrategyId: address,
        })
        .onConflictDoUpdate({
          type: 'ERC20',
          votingStrategyId: address,
        });
    } catch {
      // ERC721 has the same event signature so it will end up here
      // insertion of token info is handled in `LinearERC721Voting.ts`
    }
  } catch (e) {
    console.error('LinearERC20Voting:AzoriusSet', e);
  }
});

ponder.on('LinearERC20Voting:RequiredProposerWeightUpdated', async ({ event, context }) => {
  try {
    const { requiredProposerWeight } = event.args;
    const strategy = event.log.address;
    await context.db
      .insert(votingStrategy)
      .values({
        address: strategy,
        requiredProposerWeight,
      })
      .onConflictDoUpdate({ requiredProposerWeight });
  } catch (e) {
    console.error('LinearERC20Voting:RequiredProposerWeightUpdated', e);
  }
});

ponder.on('LinearERC20Voting:QuorumNumeratorUpdated', async ({ event, context }) => {
  try {
    const { quorumNumerator } = event.args;
    const strategy = event.log.address;
    await context.db
      .insert(votingStrategy)
      .values({
        address: strategy,
        quorumNumerator,
      })
      .onConflictDoUpdate({ quorumNumerator });
  } catch (e) {
    console.error('LinearERC20Voting:QuorumNumeratorUpdated', e);
  }
});

ponder.on('LinearERC20Voting:BasisNumeratorUpdated', async ({ event, context }) => {
  try {
    const { basisNumerator } = event.args;
    const strategy = event.log.address;
    await context.db
      .insert(votingStrategy)
      .values({
        address: strategy,
        basisNumerator,
      })
      .onConflictDoUpdate({ basisNumerator });
  } catch (e) {
    console.error('LinearERC20Voting:BasisNumeratorUpdated', e);
  }
});

// covers ERC20 and ERC721
ponder.on('LinearERC20Voting:VotingPeriodUpdated', async ({ event, context }) => {
  try {
    const { votingPeriod } = event.args;
    const strategy = event.log.address;
    await context.db
      .insert(votingStrategy)
      .values({
        address: strategy,
        votingPeriod,
      })
      .onConflictDoUpdate({ votingPeriod });
  } catch (e) {
    console.error('LinearERC20Voting:VotingPeriodUpdated', e);
  }
});

ponder.on('LinearERC20Voting:Voted', async ({ event, context }) => {
  try {
    const { voter, proposalId, voteType, weight } = event.args;
    const votingStrategyAddress = event.log.address;
    const votedAt = event.block.timestamp;
    await context.db.insert(vote).values({
      voter,
      proposalId: BigInt(proposalId),
      votingStrategyAddress,
      voteType,
      weight,
      votedAt,
    });
  } catch (e) {
    console.error('LinearERC20Voting:Voted', e);
  }
});
