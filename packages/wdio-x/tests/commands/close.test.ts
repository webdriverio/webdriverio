import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockDeleteSession } = vi.hoisted(() => ({
    mockDeleteSession: vi.fn(),
}))
vi.mock('webdriverio', () => ({
    attach: vi.fn().mockResolvedValue({
        deleteSession: mockDeleteSession,
    }),
}))

import { attach } from 'webdriverio'
import { handler } from '../../src/commands/close.js'
import { writeSession, readSession } from '../../src/session.js'
import type { SessionMetadata } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-close')

describe('close command', () => {
    const meta: SessionMetadata = {
        sessionId: 'abc123',
        hostname: 'localhost',
        port: 4444,
        capabilities: { browserName: 'chrome' },
        created: '2026-02-15T10:00:00Z',
        url: 'https://example.com',
    }

    let logSpy: ReturnType<typeof vi.spyOn>
    let errorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true })
        await writeSession('default', meta, TEST_DIR)
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockDeleteSession.mockClear()
        vi.mocked(attach).mockClear()
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        errorSpy.mockRestore()
    })

    it('should delete session and clean up files', async () => {
        await handler({ session: 'default', _sessionsDir: TEST_DIR } as any)

        expect(mockDeleteSession).toHaveBeenCalled()
        const read = await readSession('default', TEST_DIR)
        expect(read).toBeNull()
    })

    it('should attach with correct session details', async () => {
        await handler({ session: 'default', _sessionsDir: TEST_DIR } as any)

        expect(attach).toHaveBeenCalledWith(
            expect.objectContaining({
                sessionId: 'abc123',
                capabilities: { browserName: 'chrome' },
                options: {
                    hostname: 'localhost',
                    port: 4444,
                },
            })
        )
    })

    it('should error when no session exists', async () => {
        await handler({ session: 'nonexistent', _sessionsDir: TEST_DIR } as any)
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No active session'))
    })

    it('should clean up files even if deleteSession fails', async () => {
        mockDeleteSession.mockRejectedValueOnce(new Error('Session already terminated'))

        await handler({ session: 'default', _sessionsDir: TEST_DIR } as any)

        const read = await readSession('default', TEST_DIR)
        expect(read).toBeNull()
    })
})
