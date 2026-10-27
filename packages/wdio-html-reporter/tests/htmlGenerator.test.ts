import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

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
})
