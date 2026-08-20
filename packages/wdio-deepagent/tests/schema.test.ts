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

    it('keeps an env block for the mcp server spawn', () => {
        const cfg = parseDeepAgentConfig({ mcp: { command: 'node', args: ['server.mjs'], env: { TOKEN: 'secret' } } })
        expect(cfg.mcp).toEqual({ command: 'node', args: ['server.mjs'], env: { TOKEN: 'secret' } })
    })
})

describe('deepagent config schema — maxHealAttempts', () => {
    it('defaults to 2 when omitted', () => {
        const cfg = parseDeepAgentConfig({})
        expect(cfg.maxHealAttempts).toBe(2)
    })

    it('parses an explicit value', () => {
        const cfg = parseDeepAgentConfig({ maxHealAttempts: 3 })
        expect(cfg.maxHealAttempts).toBe(3)
    })

    it('rejects zero (heal attempts must be >= 1)', () => {
        expect(() => parseDeepAgentConfig({ maxHealAttempts: 0 })).toThrow()
    })

    it('rejects negatives', () => {
        expect(() => parseDeepAgentConfig({ maxHealAttempts: -1 })).toThrow()
    })

    it('rejects non-integers', () => {
        expect(() => parseDeepAgentConfig({ maxHealAttempts: 2.5 })).toThrow()
    })
})

describe('deepagent config schema — appended instructions', () => {
    it('leaves the instruction fields undefined when omitted', () => {
        const cfg = parseDeepAgentConfig({})
        expect(cfg.instructionsPath).toBeUndefined()
        expect(cfg.appendInstructions).toBeUndefined()
        expect(cfg.appendInstructionsFile).toBeUndefined()
    })

    it('parses each instruction field when supplied', () => {
        const cfg = parseDeepAgentConfig({
            instructionsPath: './AGENTS.md',
            appendInstructions: 'inline rules',
            appendInstructionsFile: './RULES.md',
        })
        expect(cfg.instructionsPath).toBe('./AGENTS.md')
        expect(cfg.appendInstructions).toBe('inline rules')
        expect(cfg.appendInstructionsFile).toBe('./RULES.md')
    })
})
