import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockDeleteSession } = vi.hoisted(() => ({
    mockDeleteSession: vi.fn(),
}))
vi.mock('webdriverio', () => ({
    attach: vi.fn().mockResolvedValue({ deleteSession: mockDeleteSession }),
}))

import { handler } from '../../src/commands/session-stop.js'
import { writeSession, readSession } from '../../src/session.js'
import type { SessionMetadata } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-session-stop')

describe('session-stop command', () => {
    const meta: SessionMetadata = {
        sessionId: 'abc123', hostname: 'localhost', port: 4444,
        capabilities: { browserName: 'chrome' },
        created: '2026-02-15T10:00:00Z', url: 'https://example.com',
    }

    let logSpy: ReturnType<typeof vi.spyOn>
    let errorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true })
        await writeSession('myapp', meta, TEST_DIR)
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        errorSpy.mockRestore()
        mockDeleteSession.mockClear()
    })

    it('should stop named session and clean up', async () => {
        await handler({ name: 'myapp', _sessionsDir: TEST_DIR } as any)
        expect(mockDeleteSession).toHaveBeenCalled()
        const read = await readSession('myapp', TEST_DIR)
        expect(read).toBeNull()
    })

    it('should error when session not found', async () => {
        await handler({ name: 'nonexistent', _sessionsDir: TEST_DIR } as any)
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No session'))
    })
})
