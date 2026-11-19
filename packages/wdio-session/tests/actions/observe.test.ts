import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { pngSize, snapshot } from '../../src/actions/observe.js'
import { attachedPlan } from '../../src/debug.js'
import { Session } from '../../src/session.js'
import { SessionError } from '../../src/errors.js'

const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
)

describe('pngSize', () => {
    it('reads a PNG and ignores other files', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-png-'))
        const png = path.join(dir, 'shot.png')
        const text = path.join(dir, 'note.txt')
        fs.writeFileSync(png, PNG)
        fs.writeFileSync(text, 'not a png')
        try {
            expect(pngSize(png)).toEqual({ width: 1, height: 1 })
            expect(pngSize(text)).toBeUndefined()
        } finally {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('reads dimensions from the header of a large PNG', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-png-'))
        const png = path.join(dir, 'shot.png')
        fs.writeFileSync(png, Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]))
        const spy = vi.spyOn(fs, 'readFileSync')
        try {
            expect(pngSize(png)).toEqual({ width: 1, height: 1 })
            expect(spy).not.toHaveBeenCalled()
        } finally {
            spy.mockRestore()
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })
})

describe('snapshot (CLI)', () => {
    it('throws a SessionError with artifacts directory hint when writing the snapshot file fails', async () => {
        const artifactsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-cli-snap-'))
        const browser = {
            isBidi: false,
            capabilities: { browserName: 'chrome' },
            getUrl: vi.fn(async () => 'http://x/'),
            getTitle: vi.fn(async () => 'Shop'),
            getWindowHandles: vi.fn(async () => ['w1']),
            execute: vi.fn(async () => ({
                tree: { role: 'document', name: 'Shop', children: [{ role: 'button', name: 'Pay', ref: 'e1', interactive: true }] },
                refs: [{ id: 'e1', role: 'button', name: 'Pay', candidates: [{ selector: '#pay' }] }],
                counter: 1
            }))
        } as unknown as WebdriverIO.Browser
        const session = new Session({
            name: 'cli-test',
            cwd: artifactsDir,
            artifactsDir,
            runtimeDir: artifactsDir,
            browser,
            plan: attachedPlan(browser, { name: 'cli-test', cwd: artifactsDir, artifactsDir, runtimeDir: artifactsDir }),
            persistHistory: false
        })
        const write = vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
            throw Object.assign(new Error('EROFS: read-only file system'), { code: 'EROFS' })
        })
        try {
            let caught: unknown
            try {
                await snapshot(session, {})
            } catch (err) {
                caught = err
            }
            expect(caught).toBeInstanceOf(SessionError)
            expect(caught).toMatchObject({
                code: 'INTERNAL',
                message: expect.stringContaining('Could not write snapshot'),
                hint: expect.stringContaining(artifactsDir)
            })
        } finally {
            write.mockRestore()
            fs.rmSync(artifactsDir, { recursive: true, force: true })
        }
    })
})
