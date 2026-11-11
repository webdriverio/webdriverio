import type * as Fs from 'node:fs'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

const failWrite = vi.hoisted(() => ({ enabled: false }))
vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof Fs>()
    const writeFileSync = (file: string, data: string | NodeJS.ArrayBufferView) => {
        if (failWrite.enabled) {
            actual.writeFileSync(file, 'partial')
            throw new Error('ENOSPC')
        }
        return actual.writeFileSync(file, data)
    }
    return { ...actual, default: { ...actual, writeFileSync }, writeFileSync }
})

vi.mock(
    '@wdio/reporter',
    () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')),
)

import AllureReporter from '../src/reporter.js'
import { offloadAttachment, PENDING_ATTACHMENT_PREFIX, PENDING_ATTACHMENT_SUFFIX, resolveResultsDir } from '../src/worker.js'

const bytes = Buffer.from([0, 1, 2, 250, 251, 252])
const attachmentMessage = (overrides: Record<string, unknown> = {}) => ({
    type: 'attachment_content',
    data: { name: 'shot', content: bytes.toString('base64'), encoding: 'base64', contentType: 'image/png', fileExtension: '.png', wrapInStep: true, timestamp: 42, ...overrides }
})

describe('resolveResultsDir', () => {
    const dirs: string[] = []
    afterEach(() => dirs.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })))
    const reporterDir = (options: Record<string, string>) => {
        const reporter = new AllureReporter(options)
        return (reporter as unknown as { _allureRuntime: { writer: { config: { resultsDir: string } } } })._allureRuntime.writer.config.resultsDir
    }

    it('prefers outputDir, then resultsDir, then allure-results, like the reporter constructor', () => {
        const outputDir = temporaryDirectory()
        const resultsDir = temporaryDirectory()
        dirs.push(outputDir, resultsDir)
        expect(resolveResultsDir({ outputDir, resultsDir })).toBe(outputDir)
        expect(reporterDir({ outputDir, resultsDir })).toBe(outputDir)
        expect(resolveResultsDir({ resultsDir })).toBe(resultsDir)
        expect(reporterDir({ resultsDir })).toBe(resultsDir)
        expect(resolveResultsDir({})).toBe('allure-results')
    })
})

describe('offloadAttachment', () => {
    const resultsDir = path.join(temporaryDirectory(), 'nested', 'results')

    it('writes the decoded bytes to a pending file and returns an attachment_path message', () => {
        const result = offloadAttachment(attachmentMessage(), resultsDir)!
        expect(result.type).toBe('attachment_path')
        expect(result.data).toEqual({ name: 'shot', contentType: 'image/png', fileExtension: '.png', wrapInStep: true, timestamp: 42, path: expect.any(String) })
        expect(path.dirname(result.data.path)).toBe(resultsDir)
        expect(path.basename(result.data.path).startsWith(PENDING_ATTACHMENT_PREFIX)).toBe(true)
        expect(path.basename(result.data.path).endsWith(PENDING_ATTACHMENT_SUFFIX)).toBe(true)
        expect(fs.readFileSync((result.data as { path: string }).path).equals(bytes)).toBe(true)
    })

    it('derives the extension from the content type when none is given', () => {
        const extensionOf = (overrides: Record<string, unknown>) => (offloadAttachment(attachmentMessage({ fileExtension: undefined, ...overrides }), resultsDir)!.data as { fileExtension: string }).fileExtension
        expect(extensionOf({ contentType: 'image/png' })).toBe('.png')
        expect(extensionOf({ contentType: 'text/plain' })).toBe('.txt')
        expect(extensionOf({ contentType: 'application/x-unknown' })).toBe('')
    })

    it('keeps an explicit extension and adds the missing dot', () => {
        const extensionOf = (fileExtension: string) => (offloadAttachment(attachmentMessage({ fileExtension }), resultsDir)!.data as { fileExtension: string }).fileExtension
        expect(extensionOf('.log')).toBe('.log')
        expect(extensionOf('log')).toBe('.log')
    })

    it('removes the partial file and rethrows when the write fails', () => {
        const dir = path.join(temporaryDirectory(), 'failing')
        failWrite.enabled = true
        try {
            expect(() => offloadAttachment(attachmentMessage(), dir)).toThrow('ENOSPC')
        } finally {
            failWrite.enabled = false
        }
        expect(fs.readdirSync(dir)).toEqual([])
    })

    it('decodes with the message encoding', () => {
        const result = offloadAttachment(attachmentMessage({ content: 'héllo', encoding: 'utf-8' }), resultsDir)!
        expect(fs.readFileSync((result.data as { path: string }).path, 'utf-8')).toBe('héllo')
    })

    it('maps global attachments to global_attachment_path', () => {
        const message = { type: 'global_attachment_content', data: { name: 'g', content: bytes.toString('base64'), encoding: 'base64', contentType: 'image/png' } }
        const result = offloadAttachment(message, resultsDir)!
        expect(result.type).toBe('global_attachment_path')
        expect(fs.readFileSync((result.data as { path: string }).path).equals(bytes)).toBe(true)
    })

    it('leaves other messages alone', () => {
        expect(offloadAttachment({ type: 'step_start', data: { name: 's', start: 1 } }, resultsDir)).toBeUndefined()
        expect(offloadAttachment({ type: 'attachment_path', data: { name: 's', path: '/x', contentType: 'text/plain' } }, resultsDir)).toBeUndefined()
    })
})
