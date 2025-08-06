import { ponder } from 'ponder:registry';
import { freezeVotingStrategy } from 'ponder:schema';

// other freeze voting settings are covered by the common
// event topics in `MultisigFreezeVoting`

ponder.on('ERC721FreezeVoting:ERC721FreezeVotingSetUp', async ({ event, context }) => {
  try {
    const address = event.log.address;
    await context.db
      .update(freezeVotingStrategy, { address })
      .set({ freezeVoteType: 'ERC721' });
  } catch (e) {
    console.error('ERC721FreezeVoting:ERC721FreezeVotingSetUp', e);
  }
});
