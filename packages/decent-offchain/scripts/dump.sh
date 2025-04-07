#!/bin/bash

# Dump DAO-related tables
pg_dump decent \
  --column-inserts \
  --schema \
  --no-comments \
  --no-owner \
  -n 'onchain' \
  --table='onchain.token_type' \
  -t 'onchain.dao' \
  -t 'onchain.governance_module' \
  -t 'onchain.signer' \
  -t 'onchain.signer_to_dao' \
  -t 'onchain.voting_strategy' \
  -t 'onchain.voting_token' > test/dao_tables.sql
