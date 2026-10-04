/**
 * Like `stack.ts`, a second module whose source map is not cached yet when
 * `mock.test.ts` reads a stack with a frame of it.
 */
export function getOtherStack () {
    return new Error('stack of another module without a cached source map').stack
}
