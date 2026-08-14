import React from 'react'
import { Box, Text } from 'ink'
import { ConfirmInput } from '@inkjs/ui'
import type { TurnInterruptRequest } from '../turn.js'
import { describeActionRequest } from '../interrupt.js'
import { submitApproval } from './approvalBus.js'

/** Arrow-key Y/N approval for gated tool calls; defaults to N (matches the old `[y/N]`). */
export function ApprovalPrompt({ request }: { request: TurnInterruptRequest }): React.JSX.Element {
    return (
        <Box borderStyle="round" flexDirection="column" paddingX={1}>
            <Text bold>Approval required</Text>
            {request.actionRequests.map((action, i) => (
                <Text key={i}>{describeActionRequest(action)}</Text>
            ))}
            <ConfirmInput
                defaultChoice="cancel"
                onConfirm={() => submitApproval(true)}
                onCancel={() => submitApproval(false)}
            />
        </Box>
    )
}
