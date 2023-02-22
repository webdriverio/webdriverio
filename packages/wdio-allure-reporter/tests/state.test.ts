import { sep } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { AllureRuntime, AllureTest, AllureGroup } from 'allure-js-commons'
import { AllureReporterState } from '../src/state.js'
import { clean } from './helpers/wdio-allure-helper.js'

describe('state', () => {
    const outputDir = temporaryDirectory()
    let runtime: AllureRuntime
    let state: AllureReporterState

    beforeEach(() => {
        clean(outputDir)

        runtime = new AllureRuntime({ resultsDir: outputDir })
        state = new AllureReporterState()
    })

    it('allows to add units', () => {
        expect(state.runningUnits).toHaveLength(0)

        state.push(new AllureGroup(runtime))

        expect(state.runningUnits).toHaveLength(1)
    })

    it('allows to pop units keeping the order', () => {
        state.push(new AllureGroup(runtime))
        state.push(new AllureTest(runtime))

        expect(state.runningUnits).toHaveLength(2)

        const test = state.pop()
        const suite = state.pop()

        expect(state.runningUnits).toHaveLength(0)
        expect(test).toBeInstanceOf(AllureTest)
        expect(suite).toBeInstanceOf(AllureGroup)
    })

    describe('with suite', () => {
        it('returns last added suite', () => {
            const firstSuite = new AllureGroup(runtime)
            const secondSuite = new AllureGroup(runtime)

            firstSuite.name = 'first'
            secondSuite.name = 'second'

            state.push(firstSuite)
            state.push(secondSuite)

            expect(state.currentSuite).not.toBeUndefined()
            expect(state.currentSuite?.name).toEqual('second')
        })
    })

    describe('without suite', () => {
        it('returns undefined', () => {
            expect(state.currentSuite).toBeUndefined()
        })
    })

    describe('with test', () => {
        it('returns last added test', () => {
            const firstTest = new AllureTest(runtime)
            const secondTest = new AllureTest(runtime)

            firstTest.name = 'first'
            secondTest.name = 'second'

            state.push(firstTest)
            state.push(secondTest)

            expect(state.currentTest).not.toBeUndefined()
            expect(state.currentTest?.wrappedItem?.name).toEqual('second')
            expect(state.currentAllureTestOrStep).not.toBeUndefined()
            expect(state.currentAllureTestOrStep?.wrappedItem?.name).toEqual('second')
        })
    })

    describe('without test', () => {
        it('returns undefined', () => {
            expect(state.currentTest).toBeUndefined()
        })
    })

    describe('with step', () => {
        it('returns last added step', () => {
            const firstTest = new AllureTest(runtime)
            const firstStep = firstTest.startStep('first')
            const secondStep = firstStep.startStep('second')

            state.push(firstTest)
            state.push(firstStep)
            state.push(secondStep)

            expect(state.currentStep).not.toBeUndefined()
            expect(state.currentStep?.wrappedItem?.name).toEqual('second')
            expect(state.currentAllureTestOrStep).not.toBeUndefined()
            expect(state.currentAllureTestOrStep?.wrappedItem?.name).toEqual('second')
        })
    })

    describe('without step', () => {
        it('returns undefined', () => {
            const firstTest = new AllureTest(runtime)

            state.push(firstTest)

            expect(state.currentStep).toBeUndefined()
        })
    })

    describe('with current file', () => {
        it('returns package label', () => {
            state.currentFile = ['foo', 'bar', 'baz.test.js'].join(sep)

            expect(state.currentPackageLabel).toEqual('foo.bar.baz.test.js')
        })
    })

    describe('without current file', () => {
        it('returns undefined instead of package label', () => {
            state.currentFile = undefined

            expect(state.currentPackageLabel).toEqual(undefined)
        })
    })
})
