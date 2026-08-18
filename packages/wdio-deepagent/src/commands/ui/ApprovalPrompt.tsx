import React from 'react'
import { Box, Text } from 'ink'
import { TextInput } from '@inkjs/ui'
import type { TurnInterruptRequest } from '../turn.js'
import { describeActionRequest, parseYesNo } from '../interrupt.js'
import { submitApproval } from './approvalBus.js'

/** y/N approval for gated tool calls; defaults to N (matches the old `[y/N]`). */
export function ApprovalPrompt({ request }: { request: TurnInterruptRequest }): React.JSX.Element {
    return (
        <Box borderStyle="round" flexDirection="column" paddingX={1}>
            <Text bold>Approval required</Text>
            {request.actionRequests.map((action, i) => (
                <Text key={i}>{describeActionRequest(action)}</Text>
            ))}
            <TextInput
                placeholder="y/N"
                onSubmit={(value) => submitApproval(parseYesNo(value))}
            />
        </Box>
    )
}
