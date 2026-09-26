import type { executeHooksWithArgs, executeAsync } from '../shim.js'

export type HookFnArgs<T> = (ctx: T) => [unknown, T]

export interface WrapperMethods {
    executeHooksWithArgs: typeof executeHooksWithArgs
    executeAsync: typeof executeAsync
}

/**
 * Spec result owned by the test framework, read after the spec body.
 * Jasmine passes expectation failures through this instead of a process global.
 */
export interface FrameworkResult {
    result?: unknown
    errors?: { stack?: string, matcherName?: string }[]
}

export interface SpecFunction {
    specFn: Function
    specFnArgs: unknown[]
    /**
     * Called after the spec body. Returning a result replaces the spec return
     * value and turns the first entry of `errors` into the after-test error.
     */
    frameworkResult?: () => FrameworkResult | undefined
}

export interface BeforeHookParam<T> {
    beforeFn: Function | Function[]
    beforeFnArgs: HookFnArgs<T>
}

export interface AfterHookParam<T> {
    afterFn: Function | Function[]
    afterFnArgs: HookFnArgs<T>
}

export type SpecArguments = (
    /**
     * e.g. before(() => { ... })
     */
    [Function] |
    /**
     * e.g. before(() => { ... }, 3)
     */
    [Function, number] |
    /**
     * e.g. it('is a test', () => { ... })
     */
    [string, Function] |
    /**
     * e.g. it('is a test', () => { ... }, 3)
     */
    [string, Function, number]
)
