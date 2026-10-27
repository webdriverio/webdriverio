import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import HtmlGenerator from '../src/htmlGenerator.js'
import { Metrics, ReportData } from '../src/types.js'
import type { HtmlReporterOptions } from '../src/types.js'
import { RUNNER } from './testdata.js'

describe('HtmlGenerator.htmlOutput', () => {
    // the workers of a run write their reports to the same folder, and each copies the styles and the font
    it('copies the styles and the font when several reports in one folder end at the same time', async () => {
        const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-assets-'))
        const options = { outputDir, filename: 'report.html', reportTitle: 'Assets', produceHtml: true } as HtmlReporterOptions
        for (let round = 0; round < 5; round++) {
            const results = await Promise.all(Array.from({ length: 16 }, (_, worker) => HtmlGenerator.htmlOutput(options,
                new ReportData('Assets', RUNNER, [], new Metrics(), path.join(outputDir, `report-${round}-${worker}.html`), 'chrome'))))
            expect(results.every(Boolean)).toBe(true)
        }
        const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'report-styles.css'))
        expect(fs.readFileSync(path.join(outputDir, 'report-styles.css')).equals(css)).toBe(true)
        expect(fs.existsSync(path.join(outputDir, 'glyphicons-halflings-regular.woff'))).toBe(true)
    })

    // Windows: a copy fails with EBUSY while another worker copies the same file
    it.each([
        ['passes when another worker copies the file', true, true],
        ['fails when the file is not there', false, false]
    ])('a busy copy of the styles %s', async (_name, otherWorkerCopies, expected) => {
        const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-busy-'))
        const options = { outputDir, filename: 'report.html', reportTitle: 'Busy', produceHtml: true } as HtmlReporterOptions
        const copyFile = vi.spyOn(fsp, 'copyFile').mockImplementation(async (_from, to) => {
            if (otherWorkerCopies) {
                fs.writeFileSync(to as string, 'partial')
            }
            throw Object.assign(new Error('EBUSY: resource busy or locked, copyfile'), { code: 'EBUSY' })
        })
        try {
            const result = await HtmlGenerator.htmlOutput(options, new ReportData('Busy', RUNNER, [], new Metrics(), path.join(outputDir, 'report.html'), 'chrome'))
            expect(result).toBe(expected)
        } finally {
            copyFile.mockRestore()
        }
    })
})
