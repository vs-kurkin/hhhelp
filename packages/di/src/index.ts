import { type AwilixContainer, createContainer, InjectionMode } from 'awilix'

export function createDIContainer<T extends object>(): AwilixContainer<T> {
    return createContainer<T>({ injectionMode: InjectionMode.PROXY })
}

/**
 * @inheritDoc
 */


/**
 * @inheritDoc
 */


/**
 * @inheritDoc
 */


export type DIContainer<T extends object> = AwilixContainer<T>
export {
    asClass, asFunction, asValue,
} from 'awilix'
