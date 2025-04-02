# decent-api

Indexer and API to serve [decent-app](https://github.com/decent-org/decent-app) offchain features.

## packages

### [decent-ponder](./packages/decent-ponder)
a [Ponder](https://github.com/ponder-sh/ponder) project for indexing contracts and events

#### Indexed contracts
- [KeyValuePair](https://github.com/decentdao/decent-contracts/blob/develop/contracts/singletons/KeyValuePairs.sol)
- [FractalRegistry](https://github.com/decentdao/decent-contracts/blob/87b74fc69c788709bb606c59e41cf5a365506b06/contracts/FractalRegistry.sol) *(legacy)*

#### Open questions:
- do we need to index each Safe?
- do we need to index each Azorius?
- ponder doesn't have a way to index a dynamic list of contracts so we would need to hack it together by generating [ponder.config.ts](./packages/decent-ponder/ponder.config.ts) at runtime
- ideally we can get away with just indexing the bare minimum of contracts to serve the offchain features of decent-app

### [decent-offchain](./packages/decent-offchain)

API to access DAO information, proposals, comments, temperature checks, and SIWE authentication
