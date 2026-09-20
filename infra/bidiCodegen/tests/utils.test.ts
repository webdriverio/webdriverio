import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { findGroupByName, validateZipEntryPath, writeFile } from '../src/utils.js'
import { GENERATED_FILE_COMMENT, BASE_PROTOCOL_SPEC } from '../src/constants.js'
import type { Assignment } from 'cddl'

const tempDirs: string[] = []

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('validateZipEntryPath', () => {
    it('returns a path inside the target directory for a normal entry', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-cddl-'))
        tempDirs.push(dir)
        expect(validateZipEntryPath('local.cddl', dir)).toBe(path.join(dir, 'local.cddl'))
    })

    it('rejects directory traversal and absolute paths', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-cddl-'))
        tempDirs.push(dir)
        expect(validateZipEntryPath('../etc/passwd', dir)).toBeUndefined()
        expect(validateZipEntryPath('/etc/passwd', dir)).toBeUndefined()
        expect(validateZipEntryPath('foo/../../etc/passwd', dir)).toBeUndefined()
    })
})

describe('findGroupByName', () => {
    it('returns the matching CDDL group', () => {
        const ast = [
            { Type: 'typedef', Name: 'Foo' },
            { Type: 'group', Name: 'session.NewParameters', Properties: [] }
        ] as unknown as Assignment[]
        expect(findGroupByName(ast, 'session.NewParameters')?.Name).toBe('session.NewParameters')
        expect(findGroupByName(ast, 'missing')).toBeUndefined()
    })
})

describe('writeFile', () => {
    it('prepends the generated-file comment and normalizes CRLF', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-cddl-'))
        tempDirs.push(dir)
        const filePath = path.join(dir, 'out.ts')
        await writeFile(filePath, 'export const x = 1\r\nexport const y = 2\r\n')
        const content = fs.readFileSync(filePath, 'utf-8')
        expect(content.startsWith(GENERATED_FILE_COMMENT)).toBe(true)
        expect(content).toContain('./infra/bidiCodegen/**')
        expect(content).not.toContain('\r\n')
        expect(content).toContain('export const x = 1\n')
    })
})

describe('BASE_PROTOCOL_SPEC', () => {
    it('describes the send and sendAsync socket commands', () => {
        expect(BASE_PROTOCOL_SPEC.sendCommand.socket.command).toBe('send')
        expect(BASE_PROTOCOL_SPEC.sendAsyncCommand.socket.command).toBe('sendAsync')
    })
})
