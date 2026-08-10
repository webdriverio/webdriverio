import type { TraceAction, TraceArtifact, TraceNetworkEntry } from './reader.js'

/** Human/agent-facing failure summary of one artifact. */
export function summarizeFailures(artifact: TraceArtifact): {
    failedActions: TraceAction[]
    networkErrors: TraceNetworkEntry[]
} {
    return {
        failedActions: artifact.actions.filter((a) => !a.ok),
        networkErrors: artifact.network.filter((n) => (n.status ?? 200) >= 400),
    }
}

const actionKey = (a: { name?: string; selector?: string; value?: string }) =>
    `${a.name ?? ''}|${a.selector ?? ''}|${a.value ?? ''}`

export interface TraceDiff {
    oldActionCount: number
    newActionCount: number
    added: Array<{ name?: string; selector?: string; value?: string }>
    removed: Array<{ name?: string; selector?: string; value?: string }>
    failedNow: Array<{ name?: string; selector?: string; error?: string }>
    oldHadFailures: boolean
    newHasFailures: boolean
}

/** Structural diff between an old and a new trace artifact. */
export function diffArtifacts(oldArtifact: TraceArtifact, newArtifact: TraceArtifact): TraceDiff {
    const oldKeys = new Set(oldArtifact.actions.map(actionKey))
    const newKeys = new Set(newArtifact.actions.map(actionKey))
    return {
        oldActionCount: oldArtifact.actions.length,
        newActionCount: newArtifact.actions.length,
        added: newArtifact.actions.filter((a) => !oldKeys.has(actionKey(a))),
        removed: oldArtifact.actions.filter((a) => !newKeys.has(actionKey(a))),
        failedNow: newArtifact.actions.filter((a) => !a.ok).map((a) => ({ name: a.name, selector: a.selector, error: a.error })),
        oldHadFailures: oldArtifact.actions.some((a) => !a.ok),
        newHasFailures: newArtifact.actions.some((a) => !a.ok),
    }
}
