import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockUrlFn } = vi.hoisted(() => ({
    mockUrlFn: vi.fn(),
}))
vi.mock('webdriverio', () => ({
    remote: vi.fn().mockResolvedValue({
        sessionId: 'test-session-123',
        capabilities: { browserName: 'chrome' },
        options: { hostname: 'localhost', port: 4444 },
        url: mockUrlFn,
    }),
}))

import { remote } from 'webdriverio'
import { handler } from '../../src/commands/open.js'
import { readSession } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-open')

describe('open command', () => {
    let logSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true })
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        mockUrlFn.mockClear()
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        vi.mocked(remote).mockClear()
    })

    it('should create a session and write metadata', async () => {
        await handler({
            url: 'https://example.com',
            browser: 'chrome',
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as any)

        const meta = await readSession('default', TEST_DIR)
        expect(meta).not.toBeNull()
        expect(meta!.sessionId).toBe('test-session-123')
        expect(meta!.url).toBe('https://example.com')
    })

    it('should call remote with browserName capability', async () => {
        await handler({
            url: 'https://example.com',
            browser: 'firefox',
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as any)

        expect(remote).toHaveBeenCalledWith(
            expect.objectContaining({
                capabilities: expect.objectContaining({ browserName: 'firefox' }),
            })
        )
    })

    it('should navigate to URL when provided', async () => {
        await handler({
            url: 'https://example.com',
            browser: 'chrome',
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as any)

        expect(mockUrlFn).toHaveBeenCalledWith('https://example.com')
    })

    it('should not navigate when no URL provided', async () => {
        await handler({
            browser: 'chrome',
            session: 'no-url',
            _sessionsDir: TEST_DIR,
        } as any)

        expect(mockUrlFn).not.toHaveBeenCalled()
    })

    it('should skip if session already exists', async () => {
        // Create a session first
        await handler({
            url: 'https://example.com',
            browser: 'chrome',
            session: 'existing',
            _sessionsDir: TEST_DIR,
        } as any)

        logSpy.mockClear()
        vi.mocked(remote).mockClear()

        // Try to open again
        await handler({
            url: 'https://other.com',
            browser: 'chrome',
            session: 'existing',
            _sessionsDir: TEST_DIR,
        } as any)

        expect(remote).not.toHaveBeenCalled()
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'))
    })

    it('should build mobile capabilities when app is provided', async () => {
        await handler({
            browser: 'chrome',
            session: 'mobile',
            app: '/path/to/app.apk',
            device: 'Pixel 6',
            _sessionsDir: TEST_DIR,
        } as any)

        expect(remote).toHaveBeenCalledWith(
            expect.objectContaining({
                capabilities: expect.objectContaining({
                    'appium:app': '/path/to/app.apk',
                    'appium:deviceName': 'Pixel 6',
                    'appium:newCommandTimeout': 300,
                }),
            })
        )
    })
})
