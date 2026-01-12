# @vk/config

Centralized configuration management for NetAgent services.

## Features

- **Zod Validation**: runtime validation of environment variables.
- **Vault Integration**: automatic secret fetching from HashiCorp Vault.
- **Type Safety**: fully typed configuration object.

## Usage

```typescript
import { config } from '@vk/config'

console.log(config.NODE_ENV)
console.log(config.MONGO_URI)
```
