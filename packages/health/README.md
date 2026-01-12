# @vk/health

Health check utilities and server for NetAgent services.

## Features

- Express-based health check server.
- `/health` endpoint with detailed status.
- Prometheus metrics integration.
- Extensible health indicators.

## Usage

```typescript
import { startHealthCheckServer } from '@vk/health'

startHealthCheckServer({
  indicators: {
    db: async () => ({ status: 'up' }),
    redis: async () => ({ status: 'down', details: { error: 'Connection refused' } })
  }
})
```
