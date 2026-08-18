import React from 'react'
import { describe, expect, it, vi } from 'vitest'

// ink's layout engine (yoga-layout) loads its wasm through global fetch at
// import time; the repo's shared fetch mock (setupFiles) returns a
// non-thenable for unknown URLs, which crashes that loader. Restore node's
// real fetch (yoga falls back to its embedded base64 wasm) before loading
// the ink components and ink-testing-library (both pull ink). Static imports
// hoist above this call, so they are imported dynamically.
vi.unstubAllGlobals()

const [{ ToolCallCard }, { ApprovalPrompt }, { render }] = await Promise.all([
    import('../src/commands/ui/ToolCallCard.js'),
    import('../src/commands/ui/ApprovalPrompt.js'),
    import('ink-testing-library'),
])
const { ARGS_TRUNCATE } = await import('../src/commands/interrupt.js')

describe('ToolCallCard', () => {
    it('renders the tool name, args preview and duration', () => {
        const { lastFrame } = render(React.createElement(ToolCallCard, {
            card: { name: 'write_file', input: { path: 'x.txt' }, status: 'finished', durationMs: 12 },
        }))
        const frame = lastFrame()
        expect(frame).toContain('write_file')
        expect(frame).toContain('"path":"x.txt"')
        expect(frame).toContain('12ms')
    })

    it('renders the error text for a failed call', () => {
        const { lastFrame } = render(React.createElement(ToolCallCard, {
            card: { name: 'write_file', input: {}, status: 'error', durationMs: 4, error: 'boom' },
        }))
        const frame = lastFrame()
        expect(frame).toContain('boom')
        expect(frame).toContain('[error]')
    })

    it('renders a truncated dim output line for a finished call', () => {
        const { lastFrame } = render(React.createElement(ToolCallCard, {
            card: { name: 'write_file', input: {}, status: 'finished', durationMs: 5, output: 'x'.repeat(ARGS_TRUNCATE + 50) },
        }))
        const frame = lastFrame()
        // ink wraps the long word across lines, so assert on the character
        // count: exactly the truncation budget plus the ellipsis marker
        expect((frame!.match(/x/g) ?? []).length).toBe(ARGS_TRUNCATE)
        expect(frame).toContain('…')
    })

    it('renders an error-status card without a dim output line', () => {
        const { lastFrame } = render(React.createElement(ToolCallCard, {
            card: { name: 'write_file', input: {}, status: 'error', durationMs: 4, error: 'Error: loop guard — stop' },
        }))
        const frame = lastFrame()
        expect(frame).toContain('[error]')
        expect(frame).toContain('Error: loop guard — stop')
        expect(frame).not.toContain('…')
    })

    it('caps the card width and contains a long no-space input', () => {
        const { lastFrame } = render(React.createElement(ToolCallCard, {
            card: { name: 'write_file', input: 'x'.repeat(200), status: 'running' },
        }))
        const frame = lastFrame()
        expect(frame).toContain('write_file')
        expect(frame).toContain('… running')
        const bottom = frame!.split('\n').find((line) => line.includes('╰'))
        expect(bottom).toBeDefined()
        // max card width 110 + 2 border corners
        expect(bottom!.length).toBeLessThanOrEqual(112)
        // must not span the full mocked 100-col terminal width
        expect(bottom!.length).toBeLessThan(100)
    })
})

describe('ApprovalPrompt', () => {
    it('lists the gated action and shows the default-N y/N prompt', () => {
        const { lastFrame } = render(React.createElement(ApprovalPrompt, {
            request: { actionRequests: [{ name: 'write_file', args: {}, description: 'write it' }] },
        }))
        const frame = lastFrame()
        expect(frame).toContain('write_file')
        expect(frame).toContain('write it')
        expect(frame).toContain('y/N')
    })
})
