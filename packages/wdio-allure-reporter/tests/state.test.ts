import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { ReporterRuntime } from 'allure-js-commons/sdk/reporter'
import { FileSystemWriter } from 'allure-js-commons/sdk/reporter'
import { AllureReportState } from '../src/state.js'
import { clean, getResultFiles } from './helpers/wdio-allure-helper.js'

describe('state', () => {
    const outputDir = temporaryDirectory()
    let runtime: ReporterRuntime
    let state: AllureReportState

    beforeEach(() => {
        clean(outputDir)

        runtime = new ReporterRuntime({
            writer: new FileSystemWriter({ resultsDir: outputDir })
        })
        state = new AllureReportState(runtime)
    })

    it('allows to add units', () => {
        const scopeUuid = runtime.startScope()
        state.pushRuntimeMessage({ type: 'allure:suite:start', data: { name: 'test suite' } })

        expect(state.hasPendingSuite).toBe(true)
    })

    it('allows to pop units keeping the order', () => {
        const scopeUuid = runtime.startScope()
        state.pushRuntimeMessage({ type: 'allure:suite:start', data: { name: 'test suite' } })
        state.pushRuntimeMessage({ type: 'allure:test:start', data: { name: 'test case', start: Date.now() } })

        expect(state.hasPendingSuite).toBe(true)
        expect(state.hasPendingTest).toBe(true)

        state.pushRuntimeMessage({ type: 'allure:test:end', data: { status: 'passed' as any } })
        state.pushRuntimeMessage({ type: 'allure:suite:end', data: {} })

        expect(state.hasPendingSuite).toBe(false)
        expect(state.hasPendingTest).toBe(false)
    })

    describe('with suite', () => {
        it('returns last added suite', () => {
            state.pushRuntimeMessage({ type: 'allure:suite:start', data: { name: 'first suite', feature: true } })
            state.pushRuntimeMessage({ type: 'allure:suite:start', data: { name: 'second suite', feature: true } })

            expect(state.hasPendingSuite).toBe(true)
            expect(state.currentFeature).toBe('second suite')
        })
    })

    describe('without suite', () => {
        it('returns undefined', () => {
            expect(state.hasPendingSuite).toBe(false)
        })
    })

    describe('with test', () => {
        it('returns last added test', () => {
            state.pushRuntimeMessage({ type: 'allure:suite:start', data: { name: 'test suite' } })
            state.pushRuntimeMessage({ type: 'allure:test:start', data: { name: 'test case', start: Date.now() } })

            expect(state.hasPendingTest).toBe(true)
        })
    })

    describe('without test', () => {
        it('returns undefined', () => {
            expect(state.hasPendingTest).toBe(false)
        })
    })

    describe('with step', () => {
        it('returns last added step', () => {
            state.pushRuntimeMessage({ type: 'allure:test:start', data: { name: 'test case', start: Date.now() } })
            state.pushRuntimeMessage({ type: 'step_start', data: { name: 'first step', start: Date.now() } })
            state.pushRuntimeMessage({ type: 'step_start', data: { name: 'second step', start: Date.now() } })

            expect(state.hasPendingStep).toBe(true)
        })
    })

    describe('without step', () => {
        it('returns undefined', () => {
            expect(state.hasPendingStep).toBe(false)
        })
    })

    describe('with current file', () => {
        it('returns package label', () => {
            state.pushRuntimeMessage({ type: 'allure:hook:start', data: { name: '"before each" hook', type: 'before', start: Date.now() } })
            expect(state.hasPendingHook).toBe(true)
            state.pushRuntimeMessage({ type: 'allure:hook:end', data: { status: 'passed', stop: Date.now() } as any })
            expect(state.hasPendingHook).toBe(false)
        })
    })

    describe('without current file', () => {
        it('returns undefined instead of package label', () => {
            expect(state.hasPendingHook).toBe(false)
        })
    })

    describe('global errors', () => {
        it('writes globals file when global_error is sent outside of any test', async () => {
            state.pushRuntimeMessage({
                type: 'global_error',
                data: { message: 'something went wrong', trace: 'Error: something went wrong\n  at foo.ts:1' }
            })
            await state.processRuntimeMessage()

            const globalsFiles = getResultFiles(outputDir, [/-globals\.json$/])
            expect(globalsFiles).toHaveLength(1)

            const content = JSON.parse(fs.readFileSync(path.join(outputDir, globalsFiles[0]), 'utf-8'))
            expect(content.errors).toHaveLength(1)
            expect(content.errors[0]).toMatchObject({
                message: 'something went wrong',
                trace: 'Error: something went wrong\n  at foo.ts:1'
            })
            expect(content.attachments).toHaveLength(0)
        })

        it('writes globals file when global_error is sent during an active test', async () => {
            state.pushRuntimeMessage({ type: 'allure:suite:start', data: { name: 'suite' } })
            state.pushRuntimeMessage({ type: 'allure:test:start', data: { name: 'test', start: Date.now() } })
            state.pushRuntimeMessage({
                type: 'global_error',
                data: { message: 'global failure' }
            })
            state.pushRuntimeMessage({ type: 'allure:test:end', data: { status: 'passed' as any } })
            state.pushRuntimeMessage({ type: 'allure:suite:end', data: {} })
            await state.processRuntimeMessage()

            const globalsFiles = getResultFiles(outputDir, [/-globals\.json$/])
            expect(globalsFiles).toHaveLength(1)

            const content = JSON.parse(fs.readFileSync(path.join(outputDir, globalsFiles[0]), 'utf-8'))
            expect(content.errors[0]).toMatchObject({ message: 'global failure' })
        })
    })

    describe('global attachments', () => {
        it('writes globals file when global_attachment_content is sent outside of any test', async () => {
            const content = Buffer.from('attachment body', 'utf8')
            state.pushRuntimeMessage({
                type: 'global_attachment_content',
                data: {
                    name: 'my attachment',
                    content: content.toString('base64'),
                    encoding: 'base64',
                    contentType: 'text/plain',
                }
            })
            await state.processRuntimeMessage()

            const globalsFiles = getResultFiles(outputDir, [/-globals\.json$/])
            expect(globalsFiles).toHaveLength(1)

            const parsed = JSON.parse(fs.readFileSync(path.join(outputDir, globalsFiles[0]), 'utf-8'))
            expect(parsed.attachments).toHaveLength(1)
            expect(parsed.attachments[0]).toMatchObject({ name: 'my attachment', type: 'text/plain' })
            expect(parsed.errors).toHaveLength(0)
        })

        it('writes globals file when global_attachment_path is sent outside of any test', async () => {
            fs.mkdirSync(outputDir, { recursive: true })
            const tmpFile = path.join(outputDir, 'fixture.txt')
            fs.writeFileSync(tmpFile, 'file content', 'utf-8')

            state.pushRuntimeMessage({
                type: 'global_attachment_path',
                data: {
                    name: 'my file attachment',
                    path: tmpFile,
                    contentType: 'text/plain',
                }
            })
            await state.processRuntimeMessage()

            const globalsFiles = getResultFiles(outputDir, [/-globals\.json$/])
            expect(globalsFiles).toHaveLength(1)

            const parsed = JSON.parse(fs.readFileSync(path.join(outputDir, globalsFiles[0]), 'utf-8'))
            expect(parsed.attachments).toHaveLength(1)
            expect(parsed.attachments[0]).toMatchObject({ name: 'my file attachment', type: 'text/plain' })
            expect(parsed.errors).toHaveLength(0)
        })
    })
})
