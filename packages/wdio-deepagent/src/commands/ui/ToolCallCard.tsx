import React from 'react'
import { Box, Text } from 'ink'
import { ARGS_TRUNCATE } from '../interrupt.js'

export interface ToolCardState {
    name: string
    input: unknown
    status: 'running' | 'finished' | 'error'
    durationMs?: number
    error?: string
}

/** Bordered tool-call card: name + colored status, truncated args, duration. */
export function ToolCallCard({ card }: { card: ToolCardState }): React.JSX.Element {
    const json = JSON.stringify(card.input ?? {})
    const preview = json.length > ARGS_TRUNCATE ? `${json.slice(0, ARGS_TRUNCATE)}…` : json
    return (
        <Box borderStyle="round" flexDirection="column" paddingX={1}>
            <Text>
                <Text bold>🔧  {card.name}</Text>{' '}
                {card.status === 'running' && <Text color="yellow">… running</Text>}
                {card.status === 'finished' && <Text color="green">✓ finished</Text>}
                {card.status === 'error' && <Text color="red">✗ error</Text>}
            </Text>
            <Text dimColor>{preview}</Text>
            {card.durationMs !== undefined && (
                <Text>
                    <Text color={card.status === 'error' ? 'red' : 'green'}>⌛ {card.durationMs}ms</Text>
                    {card.status === 'error' && card.error ? ` — ${card.error}` : ''}
                </Text>
            )}
        </Box>
    )
}
