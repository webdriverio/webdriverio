import fs from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import AiLauncher from '../src/launcher.js'
import { RUN_DIR_ENV, writeRecords } from '../src/stats.js'

describe('AiLauncher', () => {
    it('gives the workers a directory for their records and prints the summary at the end', async () => {
        const launcher = new AiLauncher({ cache: 'heal' }, {}, { outputDir: '/project/logs' })
        await launcher.onPrepare()
        const dir = process.env[RUN_DIR_ENV]!
        expect(fs.existsSync(dir)).toBe(true)

        await writeRecords([{ instruction: 'Add a shirt', source: 'model', usage: { input: 10, output: 5 }, durationMs: 1 }], dir)
        const log = vi.spyOn(console, 'log').mockImplementation(() => {})
        await launcher.onComplete()

        expect(log).toHaveBeenCalledWith(expect.stringContaining('@wdio/ai-service: 1 act call · 0 from cache · 0 healed without the model · 0 healed by the model · 1 recorded by the model · 15 tokens'))
        expect(log).toHaveBeenCalledWith(expect.stringContaining('Updated cache entries: /project/logs/act-cache'))
        expect(fs.existsSync(dir)).toBe(false)
        expect(process.env[RUN_DIR_ENV]).toBeUndefined()
        log.mockRestore()
    })

    it('prints nothing when no act call ran', async () => {
        const launcher = new AiLauncher()
        await launcher.onPrepare()
        const log = vi.spyOn(console, 'log').mockImplementation(() => {})
        await launcher.onComplete()
        expect(log).not.toHaveBeenCalled()
        log.mockRestore()
    })
})
