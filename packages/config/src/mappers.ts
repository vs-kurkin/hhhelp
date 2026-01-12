/**
 * Converts a snake_case or kebab-case string to camelCase.
 * e.g. 'FOO_BAR' -> 'fooBar'
 */
type SnakeToCamel<S extends string> = S extends `${ infer T }_${ infer U }`
    ? `${ Lowercase<T> }${ Capitalize<SnakeToCamel<U>> }`
    : Lowercase<S>;

/**
 * Recursively converts all keys of an object from snake_case to camelCase.
 */
export type Camelize<T> = {
    [K in keyof T as SnakeToCamel<K & string>]: T[K] extends object
        ? Camelize<T[K]>
        : T[K];
};
