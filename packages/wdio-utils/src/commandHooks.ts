/**
 * The scope of a `beforeCommand` or `afterCommand` hook: the commands that the hook runs do not run the hooks
 * again, and send no user command events
 */
export interface CommandHookStore {
    getStore(): true | undefined
    run<T>(value: true, fn: () => T): T
}

/**
 * Fallback for runtimes without `AsyncLocalStorage` (browser bundles): a plain
 * flag, so a hook still does not trigger itself via the commands it issues.
 */
const flagCommandHookStore: CommandHookStore = (() => {
    let active = false
    return {
        getStore: () => active ? true : undefined,
        run: <T>(_: true, fn: () => T): T => {
            const previous = active
            active = true
            let result: T
            try {
                result = fn()
            } catch (err) {
                active = previous
                throw err
            }
            if (result instanceof Promise) {
                return result.finally(() => { active = previous }) as T
            }
            active = previous
            return result
        }
    }
})()

let commandHookScope: CommandHookStore = flagCommandHookStore

/**
 * Node entry points register an `AsyncLocalStorage` so a hook running for one
 * concurrent test (parallel mode) does not suppress hooks of commands issued by
 * other tests.
 */
export function setCommandHookStore (store: CommandHookStore) {
    commandHookScope = store
}

export const isInCommandHook = () => commandHookScope.getStore() === true
export const runInCommandHook = (fn: () => Promise<unknown>) => commandHookScope.run(true, fn)
