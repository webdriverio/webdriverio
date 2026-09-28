import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { writeSidebars, print } from '../src/output.js'
import { englishOnly } from '../src/generateDocs.js'

const tempDirs: string[] = []

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('writeSidebars', () => {
    it('writes pretty-printed JSON to website/sidebars.json', () => {
        const websiteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-sidebars-'))
        tempDirs.push(websiteDir)
        writeSidebars({ docs: ['gettingstarted'] }, websiteDir)
        expect(JSON.parse(fs.readFileSync(path.join(websiteDir, 'sidebars.json'), 'utf-8')))
            .toEqual({ docs: ['gettingstarted'] })
    })
})

describe('englishOnly', () => {
    it('is set by --en or DOCS_ENGLISH_ONLY=1', () => {
        expect(englishOnly(['node', 'index.ts'], {})).toBe(false)
        expect(englishOnly(['node', 'index.ts', '--en'], {})).toBe(true)
        expect(englishOnly(['node', 'index.ts'], { DOCS_ENGLISH_ONLY: '1' })).toBe(true)
    })
})

describe('print', () => {
    it('frames a section title', () => {
        const logs: string[] = []
        const original = console.log
        console.log = (msg?: unknown) => { logs.push(String(msg)) }
        print('Generate Protocol Docs')
        console.log = original
        expect(logs.join('\n')).toContain('Generate Protocol Docs')
        expect(logs.join('\n')).toContain('//////////////////////////////////////////////////')
    })
})
