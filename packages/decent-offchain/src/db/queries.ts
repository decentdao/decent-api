export const DEFAULT_DAO_WITH = {
  governanceModules: {
    columns: {
      address: true,
      name: true,
      description: true,
    },
    with: {
      votingStrategies: {
        columns: {
          address: true,
          minProposerBalance: true,
          name: true,
          description: true,
        },
        with: {
          votingTokens: {
            columns: {
              address: true,
              type: true,
            },
          },
        },
      },
    },
  },
  signers: {
    columns: {
      address: true,
    },
  },
  hatIdToStreamIds: {
    columns: {
      hatId: true,
      streamId: true,
    },
  },
};
