import React from 'react'
import { Box, Text } from 'ink'
import { TextInput } from '@inkjs/ui'
import type { TurnInterruptRequest } from '../turn.js'
import { formatToolCallPreview, parseYesNo } from '../interrupt.js'
import type { ApprovalQueue } from './approvalBus.js'

/** y/N approval for gated tool calls; defaults to N (matches the old `[y/N]`). */
export function ApprovalPrompt({ request, queue }: { request: TurnInterruptRequest; queue: ApprovalQueue }): React.JSX.Element {
    return (
        <Box borderStyle="round" flexDirection="column" paddingX={1}>
            <Text bold>Approval required</Text>
            {request.actionRequests.map((action, i) => (
                <Text key={i}>{formatToolCallPreview(action.name, action.args)}</Text>
            ))}
            <TextInput
                placeholder="y/N"
                onSubmit={(value) => queue.submitApproval(parseYesNo(value))}
            />
        </Box>
    )
}
