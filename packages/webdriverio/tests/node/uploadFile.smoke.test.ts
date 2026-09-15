import { expect, describe, it, afterEach } from 'vitest'

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { ZipArchive } from 'archiver'

const createdFiles: string[] = []

describe('archiver v8 ZipArchive (smoke test)', () => {
    afterEach(() => {
        for (const file of createdFiles.splice(0)) {
            fs.rmSync(file, { force: true, recursive: true })
        }
    })

    it('should construct the real ZipArchive and emit a valid zip', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-uploadFile-'))
        const filePath = path.join(tempDir, 'toUpload.jpg')
        fs.writeFileSync(filePath, 'archiver v8 smoke test content')
        createdFiles.push(filePath, tempDir)

        const data: Uint8Array[] = []
        const archive = new ZipArchive()
        await new Promise<void>((resolve, reject) => {
            archive.on('error', reject)
            archive.on('data', (chunk: Uint8Array) => data.push(chunk))
            archive.on('end', resolve)
            archive.append(fs.createReadStream(filePath), { name: 'toUpload.jpg' })
            archive.finalize()
        })

        const zip = Buffer.concat(data)
        expect(zip.subarray(0, 4).toString('latin1')).toBe('PK\u0003\u0004')
        expect(zip.includes(Buffer.from('toUpload.jpg'))).toBe(true)
    }, 10000)
})