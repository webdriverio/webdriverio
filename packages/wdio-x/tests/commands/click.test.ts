import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockClick, mock$ } = vi.hoisted(() => {
    const click = vi.fn()
    return { mockClick: click, mock$: vi.fn().mockReturnValue({ click }) }
})

vi.mock('webdriverio', () => ({
    attach: vi.fn().mockResolvedValue({ $: mock$ }),
}))

import { handler } from '../../src/commands/click.js'
import { writeSession } from '../../src/session.js'
import { writeRefs } from '../../src/refs.js'
import { getRefsPath } from '../../src/session.js'
import type { SessionMetadata } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-click')

describe('click command', () => {
    const meta: SessionMetadata = {
        sessionId: 'abc123', hostname: 'localhost', port: 4444,
        capabilities: { browserName: 'chrome' },
        created: '2026-02-15T10:00:00Z', url: 'https://example.com',
    }

    let logSpy: ReturnType<typeof vi.spyOn>
    let errorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true })
        await writeSession('default', meta, TEST_DIR)
        await writeRefs(getRefsPath('default', TEST_DIR), {
            e1: { cssSelector: 'button.submit', tagName: 'button', text: 'Submit' },
            e2: { cssSelector: '#email', tagName: 'input', text: '' },
        })
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        errorSpy.mockRestore()
        mock$.mockClear()
        mockClick.mockClear()
    })

    it('should click element by ref', async () => {
        await handler({ ref: 'e1', session: 'default', _sessionsDir: TEST_DIR } as any)
        expect(mock$).toHaveBeenCalledWith('button.submit')
        expect(mockClick).toHaveBeenCalled()
    })

    it('should error on unknown ref', async () => {
        await handler({ ref: 'e99', session: 'default', _sessionsDir: TEST_DIR } as any)
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('e99 not found'))
    })

    it('should error when no refs file exists', async () => {
        await fs.rm(getRefsPath('default', TEST_DIR), { force: true })
        await handler({ ref: 'e1', session: 'default', _sessionsDir: TEST_DIR } as any)
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No snapshot taken'))
    })
})
