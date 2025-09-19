import { describe, it, expect } from 'vitest'
import { temporaryDirectory } from 'tempy'
import fs from 'node:fs'
import path from 'node:path'

import { loadTestPlan, installBddTestPlanFilter, type LoadedTestPlan } from '../src/testplan.js'
import { includedInTestPlan as includedInTestPlanCommons } from 'allure-js-commons/sdk/reporter'

describe('testplan filtering for Mocha BDD', () => {
    it('filters by file#suite.test and registers only matched test', () => {
        const fullTitle = 'My Login application 2-1 should login with valid credentials 2-1'

        const dir = temporaryDirectory()
        const planPath = path.join(dir, 'testplan.json')
        const testPlanJson = {
            version: '1.0',
            tests: [
                // only file#suite.test selector form (dot separator)
                { id: '1', selector: 'test/specs/test.e2e.js#My Login application 2-1.should login with valid credentials 2-1' },
            ],
        }
        fs.writeFileSync(planPath, JSON.stringify(testPlanJson), 'utf8')

        const prevPlanPath = process.env.ALLURE_TESTPLAN_PATH
        process.env.ALLURE_TESTPLAN_PATH = planPath
        const plan = loadTestPlan() as LoadedTestPlan
        // sanity: augmented selectors should include dot-form title without file
        expect((plan as any).bySelector.has('My Login application 2-1.should login with valid credentials 2-1')).toBe(true)
        expect(includedInTestPlanCommons((plan as any).raw, { fullName: 'My Login application 2-1.should login with valid credentials 2-1' })).toBe(true)
        console.log('selectors:', Array.from((plan as any).bySelector.keys()))
        process.env.ALLURE_TESTPLAN_PATH = prevPlanPath

        const calls: string[] = []

        const originalDescribe = (globalThis as any).describe
        const originalIt = (globalThis as any).it
        try {
            // provide minimal BDD api for wrapper to hook into
            const fakeDescribe = ((title: string, fn?: () => void) => {
                if (typeof fn === 'function') { fn() }
                return {} as any
            }) as any
            fakeDescribe.only = ((title: string, fn?: () => void) => {
                if (typeof fn === 'function') { fn() }
                return {} as any
            }) as any
            fakeDescribe.skip = ((title: string) => ({}) ) as any

            const fakeIt = ((title: string, fn?: () => void) => {
                calls.push(title)
                return {} as any
            }) as any
            fakeIt.only = ((title: string, fn?: () => void) => {
                calls.push(title)
                return {} as any
            }) as any
            fakeIt.skip = ((title: string) => ({}) ) as any

            ;(globalThis as any).describe = fakeDescribe
            ;(globalThis as any).it = fakeIt

            installBddTestPlanFilter(plan!)

            // define a suite with 2 tests, only one should be registered
            ;(globalThis as any).describe('My Login application 2-1', () => {
                ;(globalThis as any).it('should login with valid credentials 2-1', () => undefined)
                ;(globalThis as any).it('should NOT run this test', () => undefined)
            })

            expect(calls).toHaveLength(1)
            expect(calls[0]).toBe('should login with valid credentials 2-1')
        } finally {
            ;(globalThis as any).describe = originalDescribe
            ;(globalThis as any).it = originalIt
        }
    })
})

