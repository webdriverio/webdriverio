import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { pdf } from '../../src/actions/observe.js'
import type { Session } from '../../src/session.js'

function session (saved: { file?: string }) {
    return {
        isWeb: true,
        timestamp: () => '2026-09-27T00-00-00',
        artifact: (dir: string, name: string) => `/tmp/wdio/${dir}/${name}`,
        browser: {
            savePDF: async (file: string) => {
                saved.file = file
                return Buffer.from('%PDF')
            }
        }
    } as unknown as Session
}

describe('pdf', () => {
    it('saves the page to an artifact when no path is given', async () => {
        const saved: { file?: string } = {}
        const result = await pdf(session(saved), { $cwd: '/' })
        expect(saved.file).toBe('/tmp/wdio/pdf/2026-09-27T00-00-00.pdf')
        expect(result.text).toBe('Saved PDF → /tmp/wdio/pdf/2026-09-27T00-00-00.pdf')
        expect(result.code).toBe("await browser.savePDF('/tmp/wdio/pdf/2026-09-27T00-00-00.pdf')")
        expect(result.history).toBeUndefined()
        expect(result.files).toEqual(['/tmp/wdio/pdf/2026-09-27T00-00-00.pdf'])
    })

    it('writes a caller path that ends in .pdf', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-pdf-'))
        const saved: { file?: string } = {}
        try {
            const result = await pdf(session(saved), { file: 'report.pdf', $cwd: dir })
            expect(saved.file).toBe(path.join(dir, 'report.pdf'))
            expect(result.data).toEqual({ file: path.join(dir, 'report.pdf') })
        } finally {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('rejects a path that does not end in .pdf', async () => {
        await expect(pdf(session({}), { path: 'page.txt', $cwd: '/' })).rejects.toThrow('must end with .pdf')
    })

    it('rejects native sessions', async () => {
        const native = session({})
        Object.assign(native, { isWeb: false })
        await expect(pdf(native, { $cwd: '/' })).rejects.toThrow('only supported for web')
    })
})
