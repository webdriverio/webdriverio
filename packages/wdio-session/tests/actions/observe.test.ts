import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { pngSize } from '../../src/actions/observe.js'

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
})
