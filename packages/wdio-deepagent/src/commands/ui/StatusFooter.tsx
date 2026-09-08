import React from 'react'
import { Text } from 'ink'

export interface StatusFooterProps {
    status: 'idle' | 'running' | 'approval'
    lastTurnMs?: number
    inputTokens: number
    outputTokens: number
}

/** Sticky bottom row: run status, last turn duration, session token totals. */
export function StatusFooter({ status, lastTurnMs, inputTokens, outputTokens }: StatusFooterProps): React.JSX.Element {
    const statusLabel = status === 'running' ? '… running' : status === 'approval' ? 'awaiting approval' : 'idle'
    const lastTurn = lastTurnMs === undefined ? '' : ` | last turn: ${lastTurnMs}ms`
    return (
        <Text dimColor>
            {statusLabel}
            {lastTurn} | tokens: {inputTokens} in / {outputTokens} out
        </Text>
    )
}
