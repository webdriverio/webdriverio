import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { description, descriptionHtml } from 'allure-js-commons'
import AllureReporter from '../../../src/reporter.js'
import { clean } from '../../helpers/wdio-allure-helper.js'
import { events } from '../../../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('modern runtime descriptions', () => {
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

    it('sets descriptions of different type', async () => {
        vi.mocked(process.emit).mockClear()

        await description('foo')
        await descriptionHtml('bar')

        expect(process.emit).toHaveBeenCalledTimes(2)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.runtimeMessage, {
            type: 'metadata',
            data: {
                description: 'foo'
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(2, events.runtimeMessage, {
            type: 'metadata',
            data: {
                descriptionHtml: 'bar'
            }
        })
    })
})
