import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { clean } from '../../helpers/wdio-allure-helper.js'
import AllureReporter, {
    addDescription
} from '../../../src/index.js'
import { events } from '../../../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('legacy runtime descriptions', () => {
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

    it('exports correct API', () => {
        expect(typeof addDescription).toBe('function')
    })

    it('sets descriptions of different type', async () => {
        vi.mocked(process.emit).mockClear()

        await addDescription('foo')
        await addDescription('bar', 'html')

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
