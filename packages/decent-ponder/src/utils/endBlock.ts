import { Event } from 'ponder:registry';

type ProposalInitializedEvent = Event & {
  args: { proposalId: number; votingEndBlock: number };
};

type ProposalCreatedEvent = Event & {
  args: { proposalId: bigint } & Record<string, any>;
};

// votingEndBlocks is emitted by the strategy BEFORE the proposal
// is created in Azorius so we store it in a simple Map cache
const endBlocks = new Map<string, number>();

function getKey(event: ProposalInitializedEvent | ProposalCreatedEvent) {
  return `${event.transaction.hash}:${event.args.proposalId}`;
}

export function setProposalEndBlock(event: ProposalInitializedEvent) {
  const votingEndBlock = event.args.votingEndBlock;
  endBlocks.set(getKey(event), votingEndBlock);
}

export function getProposalEndBlock(event: ProposalCreatedEvent) {
  return endBlocks.get(getKey(event));
}

export function deleteProposalEndBlock(event: ProposalCreatedEvent) {
  return endBlocks.delete(getKey(event));
}
