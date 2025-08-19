# decent-api

Indexer and API to serve [decent-app](https://github.com/decent-org/decent-app) offchain features.

## Architecture

```
    Blockchain Events                    Frontend/Clients
            |                                    |
            v                                    v
    +-------------------+                +------------------+
    |  decent-ponder    |                | decent-offchain  |
    |-------------------|                |------------------|
    | - Indexes events  |                | - REST API       |
    | - Writes indexed  |                | - Auth (SIWE)    |
    |   data to DB      |                | - Reads/writes   |
    | - Uses onchain    |                |   to DB          |
    |   schema          |                |                  |
    +-------------------+                +------------------+
            |                                    |
            |                                    |
            +-------------+    +-----------------+
                          |    |
                          v    v
                  +--------------------+
                  |    PostgreSQL      |
                  |--------------------|
                  | - onchain schema   |
                  |   (indexed data    |
                  |    from ponder)    |
                  |                    |
                  | - offchain tables  |
                  |   (sessions,       |
                  |    Safe proposals, |
                  |    etc.)           |
                  +--------------------+
```

## packages

### [decent-ponder](./packages/decent-ponder)
a [Ponder](https://github.com/ponder-sh/ponder) project for indexing contracts and events

#### Indexed contracts
*Currently indexing v1.6.0 Decent contracts*
- [KeyValuePair](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/KeyValuePairs.sol)
- [FractalRegistry](https://github.com/decentdao/decent-contracts/blob/v1.4.0/contracts/FractalRegistry.sol) *(legacy v1.4.0)*
- [ModuleProxyFactory](https://github.com/gnosisguild/zodiac/blob/master/contracts/factory/ModuleProxyFactory.sol) *(used with ponder.sh [factory pattern w/ non-factory contracts](https://ponder.sh/docs/guides/factory#usage-with-non-factory-contracts))*
  - [Azorius](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/azorius/Azorius.sol)
  - [FractalModule](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/FractalModule.sol)
  - [LinearERC20Voting](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/azorius/LinearERC20Voting.sol)
  - [LinearERC721Voting](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/azorius/LinearERC721Voting.sol)
  - [MultisigFreezeGuard](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/MultisigFreezeGuard.sol)
  - [AzoriusFreezeGuard](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/AzoriusFreezeGuard.sol)
  - [MultisigFreezeVoting](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/MultisigFreezeVoting.sol)
  - [ERC20FreezeVoting](https://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/ERC20FreezeVoting.sol)
  - [ERC721FreezeVoting](hhttps://github.com/decentdao/decent-contracts/blob/v1.6.0/contracts/ERC721FreezeVoting.sol)
- [SplitV2o2Factory](https://github.com/0xSplits/splits-contracts-monorepo/blob/splits-contracts-v2.2/packages/splits-v2/src/splitters/SplitFactoryV2.sol)  *(used with ponder.sh [factory pattern w/ non-factory contracts](https://ponder.sh/docs/guides/factory#usage-with-non-factory-contracts))*
  - [SplitV2](https://github.com/0xSplits/splits-contracts-monorepo/blob/splits-contracts-v2.2/packages/splits-v2/src/splitters/SplitWalletV2.sol)
### [decent-offchain](./packages/decent-offchain)

API to access DAO information, DAOs, proposals and SIWE authentication
