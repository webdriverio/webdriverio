import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const { mockExecute, mockGetUrl } = vi.hoisted(() => ({
    mockExecute: vi.fn(),
    mockGetUrl: vi.fn(),
}))

vi.mock('webdriverio', () => ({
    attach: vi.fn().mockResolvedValue({
        execute: mockExecute,
        getUrl: mockGetUrl,
        capabilities: { browserName: 'chrome' },
    }),
}))

import { handler } from '../../src/commands/snapshot.js'
import { writeSession } from '../../src/session.js'
import { readRefs } from '../../src/refs.js'
import { getRefsPath } from '../../src/session.js'
import type { SessionMetadata } from '../../src/session.js'

const TEST_DIR = path.join(os.tmpdir(), 'wdio-x-test-snapshot')

describe('snapshot command', () => {
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
        mockGetUrl.mockResolvedValue('https://example.com/checkout')
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(async () => {
        await fs.rm(TEST_DIR, { recursive: true, force: true })
        logSpy.mockRestore()
        errorSpy.mockRestore()
        mockExecute.mockReset()
        mockGetUrl.mockReset()
    })

    it('should capture browser elements and write refs', async () => {
        mockExecute.mockResolvedValue([
            { tagName: 'button', type: '', textContent: 'Submit', cssSelector: 'button.submit', isInViewport: true, id: '', className: '', value: '', placeholder: '', href: '', ariaLabel: '', role: '', src: '', alt: '' },
            { tagName: 'input', type: 'email', textContent: '', cssSelector: '#email', isInViewport: true, id: 'email', className: '', value: '', placeholder: 'you@example.com', href: '', ariaLabel: '', role: '', src: '', alt: '' },
        ])

        await handler({ session: 'default', visible: true, a11y: false, _sessionsDir: TEST_DIR } as any)

        expect(logSpy).toHaveBeenCalled()
        const output = logSpy.mock.calls.map(c => c[0]).join('\n')
        expect(output).toContain('e1')
        expect(output).toContain('button')

        const refs = await readRefs(getRefsPath('default', TEST_DIR))
        expect(refs).not.toBeNull()
        expect(refs!['e1']).toBeDefined()
        expect(refs!['e1'].cssSelector).toBe('button.submit')
    })

    it('should error when no session exists', async () => {
        await handler({ session: 'nonexistent', visible: true, a11y: false, _sessionsDir: TEST_DIR } as any)
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No active session'))
    })
})
