import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockClearValue, mockAddValue, mock$ } = vi.hoisted(() => {
    const clear = vi.fn()
    const add = vi.fn()
    return { mockClearValue: clear, mockAddValue: add, mock$: vi.fn().mockReturnValue({ clearValue: clear, addValue: add }) }
})

vi.mock('webdriverio', () => ({
    attach: vi.fn().mockResolvedValue({ $: mock$ }),
}))

import { handler } from '../../src/commands/fill.js'
import { writeSession } from '../../src/session.js'
import { writeRefs } from '../../src/refs.js'
import { getRefsPath } from '../../src/session.js'
import type { SessionMetadata } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-fill')

describe('fill command', () => {
    const meta: SessionMetadata = {
        sessionId: 'abc123', hostname: 'localhost', port: 4444,
        capabilities: { browserName: 'chrome' },
        created: '2026-02-15T10:00:00Z', url: 'https://example.com',
    }

    let logSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true })
        await writeSession('default', meta, TEST_DIR)
        await writeRefs(getRefsPath('default', TEST_DIR), {
            e1: { cssSelector: '#email', tagName: 'input', text: '' },
        })
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        mock$.mockClear()
        mockClearValue.mockClear()
        mockAddValue.mockClear()
    })

    it('should clear and fill input by ref', async () => {
        await handler({ ref: 'e1', text: 'hello@example.com', session: 'default', _sessionsDir: TEST_DIR } as any)
        expect(mock$).toHaveBeenCalledWith('#email')
        expect(mockClearValue).toHaveBeenCalled()
        expect(mockAddValue).toHaveBeenCalledWith('hello@example.com')
    })
})
