import { createBirpc } from 'birpc'
import type { RunnerFunctions, BrowserRunnerFunctions } from './types.js'

export function createBrowserRpc(
    exposed: Partial<BrowserRunnerFunctions>
) {
    return createBirpc<RunnerFunctions, BrowserRunnerFunctions>(
        exposed as BrowserRunnerFunctions,
        {
            post: msg => window.parent.postMessage(msg, '*'),
            on: fn => window.addEventListener('message', (e) => fn(e.data))
        }
    )
}
