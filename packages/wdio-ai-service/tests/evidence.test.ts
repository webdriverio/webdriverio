import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { HealEvidence } from '../src/evidence.js'

function fakeBrowser ({ bidi = true, screencast = true } = {}) {
    return {
        isBidi: bidi,
        saveScreenshot: vi.fn(async (file: string) => fs.writeFileSync(file, 'png')),
        getWindowHandle: vi.fn(async () => 'page-1'),
        browsingContextStartScreencast: vi.fn(async ({ destinationFolder }: { destinationFolder: string }) => {
            if (!screencast) {
                throw new Error('unknown command')
            }
            return { screencast: 'cast-1', path: path.join(destinationFolder, 'heal.webm') }
        }),
        browsingContextStopScreencast: vi.fn(async () => ({ path: '/videos/heal.webm' }))
    }
}

const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-evidence-')), 'heal')

describe('HealEvidence', () => {
    it('captures nothing until a step fails', async () => {
        const browser = fakeBrowser()
        const dir = tmp()
        const evidence = new HealEvidence(browser as unknown as WebdriverIO.Browser, dir)
        await evidence.after()
        expect(await evidence.end()).toEqual([])
        expect(browser.saveScreenshot).not.toHaveBeenCalled()
        expect(fs.existsSync(dir)).toBe(false)
    })

    it('saves a screenshot of the failure and of every heal step, and records a screencast of the heal', async () => {
        const browser = fakeBrowser()
        const dir = tmp()
        const evidence = new HealEvidence(browser as unknown as WebdriverIO.Browser, dir)
        await evidence.begin()
        await evidence.begin()
        await evidence.after()

        expect(browser.browsingContextStartScreencast).toHaveBeenCalledTimes(1)
        expect(browser.browsingContextStartScreencast).toHaveBeenCalledWith({ context: 'page-1', destinationFolder: dir })
        expect(await evidence.end()).toEqual([path.join(dir, 'failed.png'), path.join(dir, 'step-1.png'), '/videos/heal.webm'])
        expect(browser.browsingContextStopScreencast).toHaveBeenCalledWith({ screencast: 'cast-1' })
        expect(fs.existsSync(path.join(dir, 'failed.png'))).toBe(true)
    })

    it('keeps the screenshots when the browser does not record a screencast', async () => {
        for (const browser of [fakeBrowser({ screencast: false }), fakeBrowser({ bidi: false })]) {
            const dir = tmp()
            const evidence = new HealEvidence(browser as unknown as WebdriverIO.Browser, dir)
            await evidence.begin()
            expect(await evidence.end()).toEqual([path.join(dir, 'failed.png')])
            expect(browser.browsingContextStopScreencast).not.toHaveBeenCalled()
        }
    })
})
