# @vk/di

Dependency Injection container wrapper for NetAgent services.

## Features

- Based on `awilix`.
- Simplifies container creation and registration.
- Supports Lifetime management (Singleton, Scoped, Transient).

## Usage

```typescript
import { createDIContainer, asClass, asValue } from '@vk/di'

const container = createDIContainer()

container.register({
  db: asClass(DatabaseClient).singleton(),
  config: asValue(config)
})

const db = container.resolve('db')
```
