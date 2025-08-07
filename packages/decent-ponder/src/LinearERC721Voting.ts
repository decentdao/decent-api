import { ponder } from 'ponder:registry';
import { votingStrategy, votingToken } from 'ponder:schema';

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
    console.error('LinearERC721Voting:GovernanceTokenAdded', e);
  }
});

ponder.on('LinearERC721Voting:GovernanceTokenRemoved', async ({ event, context }) => {
  try {
    const { token } = event.args;
    const votingStrategyId = event.log.address;
    await context.db.delete(votingToken, { address: token, votingStrategyId });
  } catch (e) {
    console.error('LinearERC721Voting:GovernanceTokenRemoved', e);
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
    console.error('LinearERC721Voting:ProposerThresholdUpdated', e);
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
    console.error('LinearERC721Voting:QuorumThresholdUpdated', e);
  }
});
