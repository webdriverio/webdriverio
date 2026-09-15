import { expect, describe, it, afterEach, vi } from 'vitest'

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { uploadFile } from '../../src/node/uploadFile.js'

const createdFiles: string[] = []

describe('uploadFile (archiver v8 smoke test)', () => {
    afterEach(() => {
        for (const file of createdFiles.splice(0)) {
            fs.rmSync(file, { force: true, recursive: true })
        }
    })

    it('should produce a valid zip with the real archiver ZipArchive', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-uploadFile-'))
        const filePath = path.join(tempDir, 'toUpload.jpg')
        fs.writeFileSync(filePath, 'archiver v8 smoke test content')
        createdFiles.push(filePath, tempDir)

        const browser = {
            file: vi.fn().mockResolvedValue('/some/local/path')
        }

        const localPath = await uploadFile.call(browser, filePath)
        expect(localPath).toBe('/some/local/path')

        const zip = Buffer.from(vi.mocked(browser.file).mock.calls[0][0] as string, 'base64')
        expect(zip.subarray(0, 4).toString('latin1')).toBe('PK\u0003\u0004')
        expect(zip.includes(Buffer.from('toUpload.jpg'))).toBe(true)
    }, 10000)
})