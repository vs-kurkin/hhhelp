# @vk/errors

Custom error classes and handling for NetAgent services.

## Features

- Standardized error codes.
- `AppError` base class.
- Error serialization helpers.

## Usage

```typescript
import { AppError, ErrorCode } from '@vk/errors'

throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid input', { field: 'email' })
```
