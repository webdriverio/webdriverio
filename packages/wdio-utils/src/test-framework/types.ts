import type { executeHooksWithArgs, executeAsync } from '../shim'

export type HookFnArgs<T> = (ctx: T) => [unknown, T]

export interface WrapperMethods {
    executeHooksWithArgs: typeof executeHooksWithArgs
    executeAsync: typeof executeAsync
}

export interface SpecFunction {
    specFn: Function
    specFnArgs: any[]
}

export interface BeforeHookParam<T> {
    beforeFn: Function | Function[]
    beforeFnArgs: HookFnArgs<T>
}

export interface AfterHookParam<T> {
    afterFn: Function | Function[]
    afterFnArgs: HookFnArgs<T>
}

export interface JasmineContext {
    failedExpectations: Array<Record<string, unknown>>
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
