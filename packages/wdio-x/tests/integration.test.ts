import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const {
    mockUrlFn,
    mockDeleteSession,
    mockSaveScreenshot,
    mockClick,
    mockClearValue,
    mockAddValue,
    mockGetUrl,
    mockGetTitle,
    mock$,
    mockExecute,
} = vi.hoisted(() => {
    const click = vi.fn()
    const clearValue = vi.fn()
    const addValue = vi.fn()
    return {
        mockUrlFn: vi.fn(),
        mockDeleteSession: vi.fn(),
        mockSaveScreenshot: vi.fn(),
        mockClick: click,
        mockClearValue: clearValue,
        mockAddValue: addValue,
        mockGetUrl: vi.fn().mockResolvedValue('https://example.com'),
        mockGetTitle: vi.fn().mockResolvedValue('Example'),
        mock$: vi.fn().mockReturnValue({
            click,
            clearValue,
            addValue,
        }),
        mockExecute: vi.fn().mockResolvedValue([
            {
                tagName: 'button', type: '', textContent: 'Submit',
                cssSelector: 'button.submit', isInViewport: true, id: '',
                className: '', value: '', placeholder: '', href: '',
                ariaLabel: '', role: '', src: '', alt: '',
            },
            {
                tagName: 'input', type: 'email', textContent: '',
                cssSelector: '#email', isInViewport: true, id: 'email',
                className: '', value: '', placeholder: 'you@example.com',
                href: '', ariaLabel: '', role: '', src: '', alt: '',
            },
        ]),
    }
})

vi.mock('webdriverio', () => ({
    remote: vi.fn().mockResolvedValue({
        sessionId: 'integration-test-session',
        capabilities: { browserName: 'chrome' },
        options: { hostname: 'localhost', port: 4444 },
        url: mockUrlFn,
    }),
    attach: vi.fn().mockResolvedValue({
        $: mock$,
        execute: mockExecute,
        getUrl: mockGetUrl,
        getTitle: mockGetTitle,
        deleteSession: mockDeleteSession,
        saveScreenshot: mockSaveScreenshot,
        capabilities: { browserName: 'chrome' },
    }),
}))

import { handler as openHandler } from '../src/commands/open.js'
import { handler as snapshotHandler } from '../src/commands/snapshot.js'
import { handler as clickHandler } from '../src/commands/click.js'
import { handler as fillHandler } from '../src/commands/fill.js'
import { handler as screenshotHandler } from '../src/commands/screenshot.js'
import { handler as closeHandler } from '../src/commands/close.js'
import { readSession } from '../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-integration')

describe('integration: open -> snapshot -> click -> fill -> screenshot -> close', () => {
    let logSpy: ReturnType<typeof vi.spyOn>
    let errorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        await fs.mkdir(TEST_DIR, { recursive: true })
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        errorSpy.mockRestore()
        vi.clearAllMocks()
    })

    it('should complete the full workflow', async () => {
        // 1. Open — creates a browser session and writes metadata to disk
        await openHandler({
            url: 'https://example.com',
            browser: 'chrome',
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as Parameters<typeof openHandler>[0])
        const meta = await readSession('default', TEST_DIR)
        expect(meta).not.toBeNull()
        expect(meta!.sessionId).toBe('integration-test-session')

        // 2. Snapshot — captures elements and writes refs
        await snapshotHandler({
            session: 'default',
            visible: true,
            a11y: false,
            _sessionsDir: TEST_DIR,
        } as Parameters<typeof snapshotHandler>[0])

        // 3. Click — resolves ref e1 to button.submit and clicks it
        await clickHandler({
            ref: 'e1',
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as Parameters<typeof clickHandler>[0])
        expect(mock$).toHaveBeenCalledWith('button.submit')
        expect(mockClick).toHaveBeenCalled()

        // 4. Fill — resolves ref e2 to #email, clears and types
        await fillHandler({
            ref: 'e2',
            text: 'hello@test.com',
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as Parameters<typeof fillHandler>[0])
        expect(mock$).toHaveBeenCalledWith('#email')
        expect(mockClearValue).toHaveBeenCalled()
        expect(mockAddValue).toHaveBeenCalledWith('hello@test.com')

        // 5. Screenshot — saves a screenshot to the given path
        await screenshotHandler({
            path: '/tmp/integration-test.png',
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as Parameters<typeof screenshotHandler>[0])
        expect(mockSaveScreenshot).toHaveBeenCalledWith('/tmp/integration-test.png')

        // 6. Close — deletes the browser session and removes session files
        await closeHandler({
            session: 'default',
            _sessionsDir: TEST_DIR,
        } as Parameters<typeof closeHandler>[0])
        expect(mockDeleteSession).toHaveBeenCalled()
        const afterClose = await readSession('default', TEST_DIR)
        expect(afterClose).toBeNull()
    })
})
