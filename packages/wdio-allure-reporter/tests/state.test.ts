import { describe, it, expect, beforeEach } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { ReporterRuntime } from 'allure-js-commons/sdk/reporter'
import { FileSystemWriter } from 'allure-js-commons/sdk/reporter'
import { AllureReportState } from '../src/state.js'
import { clean } from './helpers/wdio-allure-helper.js'

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
})
