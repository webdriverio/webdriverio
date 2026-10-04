/**
 * Only `mock.test.ts` reads a stack with a frame of this module, so its source
 * map is not cached yet when it does.
 */
export function getStack () {
    return new Error('stack of a module without a cached source map').stack
}
