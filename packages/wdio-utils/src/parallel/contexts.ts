import logger from '@wdio/logger'

const log = logger('@wdio/utils:parallel')

export type ParallelMode = 'contexts' | 'userContexts'

export interface ParallelContextAllocation {
    context: string
    userContext?: string
}

export interface ParallelContextBrowser {
    /** Set of framework-managed parallel contexts (see session/context.ts). */
    __parallelContexts?: Set<string>
    browsingContextCreate(params: { type: string; userContext?: string }): Promise<{ context: string }>
    browsingContextClose(params: { context: string }): Promise<void>
    browserCreateUserContext?(params: Record<string, never>): Promise<{ userContext: string }>
    browserRemoveUserContext?(params: { userContext: string }): Promise<void>
}

export function resolveMaxContexts(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? Math.max(1, Math.floor(value))
        : Math.max(1, fallback)
}

async function removeUserContext(browser: ParallelContextBrowser, userContext: string, level: 'warn' | 'debug') {
    try {
        await browser.browserRemoveUserContext?.({ userContext })
    } catch (err) {
        log[level](`[Parallel] failed to remove user context ${userContext}: ${(err as Error).message}`)
    }
}

export async function allocateContext(browser: ParallelContextBrowser, mode: ParallelMode): Promise<ParallelContextAllocation> {
    let allocation: ParallelContextAllocation
    if (mode !== 'userContexts') {
        const { context } = await browser.browsingContextCreate({ type: 'window' })
        allocation = { context }
    } else {
        const { userContext } = await browser.browserCreateUserContext!({})
        try {
            const { context } = await browser.browsingContextCreate({ type: 'window', userContext })
            allocation = { context, userContext }
        } catch (err) {
            await removeUserContext(browser, userContext, 'warn')
            throw err
        }
    }
    // Register with the session ContextManager so navigations inside these
    // windows don't trigger session-global re-anchoring (tree fetch + switchToWindow).
    browser.__parallelContexts?.add(allocation.context)
    return allocation
}

/** Never rejects: close window, then remove its user context, then unregister. */
export async function cleanupAllocation(browser: ParallelContextBrowser, { context, userContext }: ParallelContextAllocation) {
    await browser.browsingContextClose({ context }).catch(
        (err) => { log.debug(`[Parallel] cleanup: failed to close context ${context}: ${(err as Error).message}`) }
    )
    if (userContext) {
        await removeUserContext(browser, userContext, 'debug')
    }
    browser.__parallelContexts?.delete(context)
}
