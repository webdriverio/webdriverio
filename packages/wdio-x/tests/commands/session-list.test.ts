import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockGetTitle } = vi.hoisted(() => ({
    mockGetTitle: vi.fn().mockResolvedValue('Example'),
}))
vi.mock('webdriverio', () => ({
    attach: vi.fn().mockResolvedValue({ getTitle: mockGetTitle }),
}))

import { handler } from '../../src/commands/session-list.js'
import { writeSession } from '../../src/session.js'
import type { SessionMetadata } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-session-list')

describe('session-list command', () => {
    const meta: SessionMetadata = {
        sessionId: 'abc123', hostname: 'localhost', port: 4444,
        capabilities: { browserName: 'chrome' },
        created: '2026-02-15T10:00:00Z', url: 'https://example.com',
    }

    let logSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true })
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        mockGetTitle.mockClear()
    })

    it('should list active sessions', async () => {
        await writeSession('default', meta, TEST_DIR)
        await writeSession('myapp', { ...meta, sessionId: 'def456', url: 'https://app.example.com' }, TEST_DIR)

        await handler({ _sessionsDir: TEST_DIR } as any)

        const output = logSpy.mock.calls.map(c => c[0]).join('\n')
        expect(output).toContain('default')
        expect(output).toContain('myapp')
    })

    it('should show message when no sessions', async () => {
        await handler({ _sessionsDir: TEST_DIR } as any)

        const output = logSpy.mock.calls.map(c => c[0]).join('\n')
        expect(output).toContain('No active sessions')
    })
})
