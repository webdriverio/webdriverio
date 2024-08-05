import { AsyncLocalStorage } from 'node:async_hooks'

import type { Readable } from 'node:stream'

const originalProcess = process
const processLocals = new AsyncLocalStorage()

export interface IsolatedProcess {
    stdout: Readable | null,
    stderr: Readable | null,
    send(args:any): any,
    on(event: string, ars: any): any,
    kill(args: any): any,
}

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

export function runWithProcessContext(ctx: {[key:string] : any}, callback: () => unknown) {
    return processLocals.run(ctx, callback)
}
