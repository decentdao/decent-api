# decent-offchain

API to access DAO information, proposals, comments, temperature checks, and SIWE authentication.

## Prerequisites

Required:
- Install [bun](https://bun.sh/docs/installation)

- Install PostgreSQL
  - [macOS (brew)](https://formulae.brew.sh/formula/postgresql@16)
  - [Ubuntu](https://www.postgresql.org/download/linux/ubuntu/) `untested`
  - [Windows](https://www.postgresql.org/download/windows/) `untested`

## Setup

install dependencies:
```bash
bun install
```

> The API depends on data from [decent-ponder](../decent-ponder). In order to speed up development, seed the database from the backup file.

(macOS) local database setup:
```bash
brew services start postgresql@16
createdb decent
bash scripts/database/restore.sh
```

## Running

```bash
bun run dev
```

## API
see live [API docs](https://decent-offchain.up.railway.app/docs)
