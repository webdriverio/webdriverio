import { describe, expect, it } from 'vitest'
import { AIMessage, ToolMessage } from '@langchain/core/messages'
import { extractAgentReply } from '../src/commands/turn.js'

describe('extractAgentReply', () => {
    it('returns plain string content from the last AI message', () => {
        const messages = [
            new ToolMessage({ content: 'done', tool_call_id: 'c1' }),
            new AIMessage('all good'),
        ]
        expect(extractAgentReply(messages)).toBe('all good')
    })

    it('joins text blocks from anthropic-style block content (thinking + text)', () => {
        const messages = [
            new AIMessage({
                content: [
                    { type: 'thinking', thinking: 'plan', signature: 's' },
                    { type: 'text', text: 'The title is' },
                    { type: 'text', text: 'Fixture Page' },
                ],
            }),
        ]
        expect(extractAgentReply(messages)).toBe('The title is\nFixture Page')
    })

    it('ignores block content with no text blocks (thinking-only reply)', () => {
        const messages = [
            new AIMessage({ content: [{ type: 'thinking', thinking: 'no text', signature: 's' }] }),
        ]
        expect(extractAgentReply(messages)).toBe('')
    })

    it('returns empty when there is no AI message', () => {
        expect(extractAgentReply([new ToolMessage({ content: 'done', tool_call_id: 'c1' })])).toBe('')
    })
})
