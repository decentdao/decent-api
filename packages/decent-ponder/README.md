# decent-ponder

Ponder relies on a PostgreSQL database to store the indexed data

## Setup
### Database

Install PostgreSQL (macOS) *TODO: add instructions for other OS*
```bash
brew install postgresql@15
```

Create a database
```bash
createdb decent
```

Start the database
```bash
npm run psql
```

### Ponder
Add your RPC URLs and database URL to `.env.local`
```bash
cp example.env.local .env.local
```

Install dependencies
```bash
npm install
```

Run the indexer
```bash
npm run dev
```
