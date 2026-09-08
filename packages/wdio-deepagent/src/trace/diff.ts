import { diffArrays } from 'diff'

import type { TraceAction, TraceArtifact, TraceNetworkEntry } from './reader.js'
import { isNetworkError } from './reader.js'

/** Human/agent-facing failure summary of one artifact. */
export function summarizeFailures(artifact: TraceArtifact): {
    failedActions: TraceAction[]
    networkErrors: TraceNetworkEntry[]
} {
    return {
        failedActions: artifact.actions.filter((a) => !a.ok),
        networkErrors: artifact.network.filter(isNetworkError),
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

/** `{name, selector, error}` projection of one action for failure reports. */
export function actionSummary(a: TraceAction): { name?: string; selector?: string; error?: string } {
    return { name: a.name, selector: a.selector, error: a.error }
}

/** Failure projections for every failed action, in timeline order. */
export function failureSummaries(actions: TraceAction[]): Array<{ name?: string; selector?: string; error?: string }> {
    return actions.filter((a) => !a.ok).map(actionSummary)
}

/** Structural diff between an old and a new trace artifact. */
export function diffArtifacts(oldArtifact: TraceArtifact, newArtifact: TraceArtifact): TraceDiff {
    const changes = diffArrays(oldArtifact.actions, newArtifact.actions, {
        comparator: (a, b) => actionKey(a) === actionKey(b),
    })
    return {
        oldActionCount: oldArtifact.actions.length,
        newActionCount: newArtifact.actions.length,
        added: changes.filter((c) => c.added).flatMap((c) => c.value),
        removed: changes.filter((c) => c.removed).flatMap((c) => c.value),
        failedNow: failureSummaries(newArtifact.actions),
        oldHadFailures: oldArtifact.actions.some((a) => !a.ok),
        newHasFailures: newArtifact.actions.some((a) => !a.ok),
    }
}
