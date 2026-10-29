import type * as Fs from 'node:fs'
import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

const warn = vi.hoisted(() => vi.fn())
const failFs = vi.hoisted(() => ({ rename: false }))
vi.mock('node:fs', async (importOriginal) => {
    const actual = await importOriginal<typeof Fs>()
    const renameSync = (...args: Parameters<typeof actual.renameSync>) => {
        if (failFs.rename) {
            throw Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' })
        }
        return actual.renameSync(...args)
    }
    return { ...actual, default: { ...actual, renameSync }, renameSync }
})
vi.mock('@wdio/logger', () => ({ default: () => ({ warn, info: vi.fn(), debug: vi.fn(), error: vi.fn() }) }))

vi.mock(
    '@wdio/reporter',
    () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')),
)

import AllureReporter from '../src/reporter.js'
import { LinkingFileSystemWriter } from '../src/writer.js'
import { offloadAttachment, PENDING_ATTACHMENT_PREFIX, PENDING_ATTACHMENT_SUFFIX } from '../src/worker.js'
import { getResults } from './helpers/wdio-allure-helper.js'
import { runnerEnd, runnerStart } from './__fixtures__/runner.js'
import { suiteEnd, suiteStart } from './__fixtures__/suite.js'
import { testPassed, testStart } from './__fixtures__/testState.js'

const content = 'pixels'
const pendingFile = (dir: string) => path.join(dir, `${PENDING_ATTACHMENT_PREFIX}abc${PENDING_ATTACHMENT_SUFFIX}`)

describe('LinkingFileSystemWriter', () => {
    let resultsDir: string
    let writer: LinkingFileSystemWriter

    beforeEach(() => {
        warn.mockClear()
        failFs.rename = false
        resultsDir = temporaryDirectory()
        writer = new LinkingFileSystemWriter(resultsDir)
    })

    it('renames a pending file instead of copying it', () => {
        const from = pendingFile(resultsDir)
        fs.writeFileSync(from, content)
        writer.writeAttachmentFromPath('x-attachment.png', from)
        expect(fs.existsSync(from)).toBe(false)
        expect(fs.readFileSync(path.join(resultsDir, 'x-attachment.png'), 'utf-8')).toBe(content)
    })

    it('copies a user file outside the results folder and keeps the source', () => {
        const from = path.join(temporaryDirectory(), `${PENDING_ATTACHMENT_PREFIX}abc${PENDING_ATTACHMENT_SUFFIX}`)
        fs.writeFileSync(from, content)
        writer.writeAttachmentFromPath('x-attachment.png', from)
        expect(fs.existsSync(from)).toBe(true)
        expect(fs.readFileSync(path.join(resultsDir, 'x-attachment.png'), 'utf-8')).toBe(content)
    })

    it('copies a user file inside the results folder that is not pending', () => {
        const from = path.join(resultsDir, 'mine.png')
        fs.writeFileSync(from, content)
        writer.writeAttachmentFromPath('x-attachment.png', from)
        expect(fs.existsSync(from)).toBe(true)
        expect(fs.readFileSync(path.join(resultsDir, 'x-attachment.png'), 'utf-8')).toBe(content)
    })

    it('copies the pending file when the rename fails', () => {
        const from = pendingFile(resultsDir)
        fs.writeFileSync(from, content)
        failFs.rename = true
        writer.writeAttachmentFromPath('x-attachment.png', from)
        expect(fs.readFileSync(path.join(resultsDir, 'x-attachment.png'), 'utf-8')).toBe(content)
        expect(fs.existsSync(from)).toBe(false)
        expect(warn).not.toHaveBeenCalled()
    })

    it('warns without throwing when both the rename and the copy fail', () => {
        failFs.rename = true
        expect(() => writer.writeAttachmentFromPath('x-attachment.png', pendingFile(resultsDir))).not.toThrow()
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0][0]).toContain('EPERM')
        expect(fs.existsSync(path.join(resultsDir, 'x-attachment.png'))).toBe(false)
    })

    it('warns instead of throwing when the pending file is gone', () => {
        expect(() => writer.writeAttachmentFromPath('x-attachment.png', pendingFile(resultsDir))).not.toThrow()
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0][0]).toContain('ENOENT')
    })
})

describe('Allure reporter with an offloaded attachment', () => {
    const run = async (wrapInStep: boolean, attachment: Record<string, unknown> = { contentType: 'image/png', fileExtension: '.png' }) => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })
        const message = offloadAttachment({
            type: 'attachment_content',
            data: { name: 'shot', content: Buffer.from(content).toString('base64'), encoding: 'base64', ...attachment, wrapInStep }
        }, outputDir)!
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.emit('allure:runtimeMessage', message)
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())
        return { outputDir, result: getResults(outputDir).results[0] }
    }

    it('stores the file as <uuid>-attachment.png and references it from the test', async () => {
        const { outputDir, result } = await run(false)
        expect(result.attachments).toHaveLength(1)
        expect(result.attachments[0]).toMatchObject({ name: 'shot', type: 'image/png', source: expect.stringMatching(/^[0-9a-f-]+-attachment\.png$/) })
        expect(fs.readFileSync(path.join(outputDir, result.attachments[0].source), 'utf-8')).toBe(content)
        expect(fs.readdirSync(outputDir).filter((file) => file.startsWith(PENDING_ATTACHMENT_PREFIX))).toEqual([])
    })

    it.each([
        ['image/png', undefined, /-attachment\.png$/],
        ['text/plain', undefined, /-attachment\.txt$/],
        ['image/png', '.log', /-attachment\.log$/]
    ])('names the stored %s file (extension %s) after the explicit extension, else its type', async (contentType, fileExtension, expected) => {
        const { outputDir, result } = await run(false, { contentType, fileExtension })
        expect(result.attachments[0].source).toMatch(expected)
        expect(fs.readdirSync(outputDir).filter((file) => file.endsWith(PENDING_ATTACHMENT_SUFFIX))).toEqual([])
    })

    it('puts it inside a step when wrapInStep is set', async () => {
        const { result } = await run(true)
        expect(result.attachments ?? []).toHaveLength(0)
        expect(result.steps[0].attachments).toHaveLength(1)
        expect(result.steps[0].attachments[0].source).toMatch(/-attachment\.png$/)
    })
})
