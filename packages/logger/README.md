# @vk/logger

Structured logging wrapper for NetAgent services, based on Winston.

## Features

- JSON formatting for production.
- Colored output for development.
- Standardized log levels.
- Metadata injection.

## Usage

```typescript
import { makeLogger } from '@vk/logger'

const logger = makeLogger('my-service')

logger.info('Hello world', { foo: 'bar' })
logger.error('Something went wrong', { error })
```
