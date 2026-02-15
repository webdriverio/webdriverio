import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockSaveScreenshot } = vi.hoisted(() => ({
    mockSaveScreenshot: vi.fn(),
}))
vi.mock('webdriverio', () => ({
    attach: vi.fn().mockResolvedValue({ saveScreenshot: mockSaveScreenshot }),
}))

import { handler } from '../../src/commands/screenshot.js'
import { writeSession } from '../../src/session.js'
import type { SessionMetadata } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-screenshot')

describe('screenshot command', () => {
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
        mockSaveScreenshot.mockClear()
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        errorSpy.mockRestore()
    })

    it('should save screenshot to specified path', async () => {
        await handler({ path: '/tmp/test.png', session: 'default', _sessionsDir: TEST_DIR } as any)
        expect(mockSaveScreenshot).toHaveBeenCalledWith('/tmp/test.png')
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('/tmp/test.png'))
    })

    it('should generate default filename when no path given', async () => {
        await handler({ session: 'default', _sessionsDir: TEST_DIR } as any)
        expect(mockSaveScreenshot).toHaveBeenCalledWith(expect.stringContaining('screenshot-'))
        expect(mockSaveScreenshot).toHaveBeenCalledWith(expect.stringMatching(/\.png$/))
    })

    it('should error when no session exists', async () => {
        await handler({ session: 'nonexistent', _sessionsDir: TEST_DIR } as any)
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No active session'))
        expect(mockSaveScreenshot).not.toHaveBeenCalled()
    })
})
