import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { ReportAggregator } from '../src/index.js'

describe('ReportAggregator', () => {
    const dirs: string[] = []
    const tempDir = () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-reporter-aggregator-'))
        dirs.push(dir)
        return dir
    }
    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('reads only the files that end with .json', () => {
        const dir = tempDir()
        fs.writeFileSync(path.join(dir, 'report-0-0.json'), '{}')
        // `indexOf` gives -1 for these names, and -1 is also `length - 5` for a name of 4 characters
        fs.writeFileSync(path.join(dir, 'a.md'), 'text')
        fs.writeFileSync(path.join(dir, 'logs'), 'text')
        fs.writeFileSync(path.join(dir, 'report.json.bak'), '{}')
        const files = new ReportAggregator({ outputDir: dir, filename: 'master-report.html' }).readJsonFiles()
        expect(files.map((file) => path.basename(file))).toEqual(['report-0-0.json'])
    })
})
