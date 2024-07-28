import { AsyncLocalStorage } from 'node:async_hooks'

const originalProcess = process
const processLocals = new AsyncLocalStorage()
export const patchedProcess = new Proxy(
    process,
    {
        get: (self: never, prop: any) => {
            const overridenValue = processLocals.getStore() && (processLocals.getStore() as any)[prop]
            return overridenValue || (originalProcess as any)[prop]
        }
    }
)

globalThis.process = patchedProcess

export function runWithProcessContext(ctx: {[key:string] : string}, callback: () => unknown) {
    return processLocals.run(ctx, callback)
}
