import React from 'react'
import { Box, Text, useStdout } from 'ink'
import { ARGS_TRUNCATE } from '../interrupt.js'

export interface ToolCardState {
    name: string
    input: unknown
    status: 'running' | 'finished' | 'error'
    durationMs?: number
    error?: string
    output?: string
}

/** Bordered tool-call card: name + colored status, truncated args, duration. */
export function ToolCallCard({ card }: { card: ToolCardState }): React.JSX.Element {
    const { stdout } = useStdout()
    const columns = stdout.columns ?? 120
    const json = JSON.stringify(card.input ?? {})
    const preview = json.length > ARGS_TRUNCATE ? `${json.slice(0, ARGS_TRUNCATE)}…` : json
    return (
        <Box borderStyle="round" flexDirection="column" paddingX={1} width={Math.max(40, Math.min(columns - 4, 110))}>
            <Text>
                <Text bold>{card.name}</Text>{' '}
                {card.status === 'running' && <Text color="yellow">… running</Text>}
                {card.status === 'finished' && <Text color="green">[ok]</Text>}
                {card.status === 'error' && <Text color="red">[error]</Text>}
            </Text>
            <Text dimColor wrap="wrap">{preview}</Text>
            {card.output !== undefined && card.status !== 'running' && (
                <Text dimColor wrap="wrap">{card.output.length > ARGS_TRUNCATE ? `${card.output.slice(0, ARGS_TRUNCATE)}…` : card.output}</Text>
            )}
            {card.durationMs !== undefined && (
                <Text>
                    <Text color={card.status === 'error' ? 'red' : 'green'}>{card.durationMs}ms</Text>
                    {card.status === 'error' && card.error ? ` — ${card.error}` : ''}
                </Text>
            )}
        </Box>
    )
}
