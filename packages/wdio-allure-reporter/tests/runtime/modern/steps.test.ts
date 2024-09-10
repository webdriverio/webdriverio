import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { clean } from '../../helpers/wdio-allure-helper.js'
import AllureReporter from '../../../src/index.js'
import { Status, step, logStep } from 'allure-js-commons'
import { events } from '../../../build/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('modern runtime steps', () => {
    const outputDir = temporaryDirectory()
    const processEmit = process.emit.bind(process)

    beforeEach(() => {
        clean(outputDir)
        process.emit = vi.fn() as any
        new AllureReporter({ outputDir })
    })

    afterEach(() => {
        process.emit = processEmit
    })

    it('adds step without body', async () => {
        vi.mocked(process.emit).mockClear()

        await logStep('Step')

        expect(process.emit).toHaveBeenCalledTimes(2)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.runtimeMessage, {
            type: 'step_start',
            data: expect.objectContaining({
                name: 'Step'
            })
        })
        expect(process.emit).toHaveBeenNthCalledWith(2, events.runtimeMessage, {
            type: 'step_stop',
            data: expect.objectContaining({
                status: Status.PASSED
            })
        })
    })

    it('adds step with body', async () => {
        vi.mocked(process.emit).mockClear()

        await step('Step', () => {})

        expect(process.emit).toHaveBeenCalledTimes(2)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.runtimeMessage, {
            type: 'step_start',
            data: expect.objectContaining({
                name: 'Step'
            })
        })
        expect(process.emit).toHaveBeenNthCalledWith(2, events.runtimeMessage, {
            type: 'step_stop',
            data: expect.objectContaining({
                status: Status.PASSED
            })
        })
    })
})
