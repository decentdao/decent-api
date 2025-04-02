# Decent API Documentation

## Default Endpoints

### Get API metadata
GET `/`
- **Response**: `Meta`

## Health Endpoints

### Get API health status
GET `/health`
- **Response**: `string`

## Chains Endpoints

### Get all chains with DAOs
GET `/chains`
- **Response**: `string[]`

## DAO Endpoints

### Get all DAOs
GET `/d`
- **Response**: `Dao[]`

### Get all DAOs for a specific chain
GET `/d/{chainId}`
- **Parameters**:
  - `chainId`: Chain ID parameter

- **Response**: `Dao[]`

### Get a DAO by chain ID and address
GET `/d/{chainId}/{address}`
- **Parameters**:
  - `chainId`: Chain ID parameter
  - `address`: Address parameter

- **Response**: `Dao`

### Get all proposals for a DAO
GET `/d/{chainId}/{address}/proposals`
- **Parameters**:
  - `chainId`: Chain ID parameter
  - `address`: Address parameter

- **Response**: `Proposal[]`

### Create a proposal
POST `/d/{chainId}/{address}/proposals`
- **Body**: `...`

- **Response**: `Proposal`

### Get a proposal by slug
GET `/d/{chainId}/{address}/proposals/{slug}`
- **Parameters**:
  - `slug`: Slug or id of the proposal

- **Response**: `Proposal`

## Auth Endpoints

### Get a nonce for SIWE authentication
GET `/auth/nonce`
- **Response**: `Nonce`

### Verify a SIWE message and signature
POST `/auth/verify`
- **Body**: ` message: string, signature: string `

- **Response**: `Me`

### Get the current authenticated user's information
GET `/auth/me`
- **Response**: `Me`

### Log out the current user
POST `/auth/logout`
- **Response**: `Logout`

