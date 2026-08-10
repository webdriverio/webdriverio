import { describe, expect, it } from 'vitest'
import { parseModelConfig } from '../src/model/schema.js'
import { parseDeepAgentConfig } from '../src/config/schema.js'

describe('model schema defaults', () => {
    it('defaults maxTokens to 8192 (reasoning models starve at 1024)', () => {
        const cfg = parseModelConfig({ provider: 'openai', model: 'fake' })
        expect(cfg.maxTokens).toBe(8192)
    })

    it('still honors an explicit maxTokens', () => {
        const cfg = parseModelConfig({ provider: 'openai', model: 'fake', maxTokens: 512 })
        expect(cfg.maxTokens).toBe(512)
    })
})

describe('deepagent config schema — mcp', () => {
    it('accepts mcp: null (harness without browser tools)', () => {
        const cfg = parseDeepAgentConfig({ mcp: null })
        expect(cfg.mcp).toBeNull()
    })

    it('still defaults mcp to the npx spawn when omitted', () => {
        const cfg = parseDeepAgentConfig({})
        expect(cfg.mcp).toEqual({ command: 'npx', args: ['-y', '@wdio/mcp'] })
    })
})
