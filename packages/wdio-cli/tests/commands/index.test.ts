import { describe, expect, it } from 'vitest'
import { commands } from '../../src/commands/index.js'

describe('commands registry', () => {
    it('registers the deepagent command with a lazy handler', () => {
        const names = commands.map((c) => c.command)
        expect(names).toContain('deepagent [command]')

        const deepagent = commands.find((c) => c.command === 'deepagent [command]')
        expect(deepagent?.desc).toContain('DeepAgent')
        // handler must be a function; the heavy @wdio/deepagent import is
        // deferred to invocation so the core CLI stays free of langchain deps
        expect(typeof deepagent?.handler).toBe('function')
    })
})
