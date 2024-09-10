import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { testCaseId } from 'allure-js-commons'
import { clean } from '../../helpers/wdio-allure-helper.js'
import AllureReporter from '../../../src/index.js'
import { events } from '../../../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('modern runtime testCaseId', () => {
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

    it('sets testCaseId', async () => {
        vi.mocked(process.emit).mockClear()

        await testCaseId('foo')

        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.runtimeMessage, {
            type: 'metadata',
            data: {
                testCaseId: 'foo'
            }
        })
    })
})
