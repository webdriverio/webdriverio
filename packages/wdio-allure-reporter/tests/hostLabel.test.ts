import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Label } from 'allure-js-commons'
import { LabelName } from 'allure-js-commons'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { clean, getResults, mapBy } from './helpers/wdio-allure-helper.js'
import { runnerEnd, runnerStart } from './__fixtures__/runner.js'
import { suiteEnd, suiteStart } from './__fixtures__/suite.js'
import { testPassed, testStart } from './__fixtures__/testState.js'

vi.mock(
    '@wdio/reporter',
    () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')),
)

/**
 * its own file: allure-js-commons reads ALLURE_HOST_NAME once and keeps the value
 */
describe('ALLURE_HOST_NAME', () => {
    const outputDir = temporaryDirectory()

    beforeAll(() => {
        vi.stubEnv('ALLURE_LABEL_host', undefined)
        vi.stubEnv('ALLURE_HOST_NAME', 'build-agent-7')
    })

    afterAll(() => {
        vi.unstubAllEnvs()
        clean(outputDir)
    })

    it('is the default host', async () => {
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        const hosts = mapBy<Label>(results[0].labels, 'name')[LabelName.HOST]
        expect(hosts).toEqual([{ name: LabelName.HOST, value: 'build-agent-7' }])
    })
})
