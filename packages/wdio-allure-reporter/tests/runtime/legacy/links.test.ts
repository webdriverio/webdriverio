import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LinkType } from 'allure-js-commons'
import { temporaryDirectory } from 'tempy'
import { clean } from '../../helpers/wdio-allure-helper.js'
import AllureReporter, {
    addLink,
    addIssue,
    addTestId,
} from '../../../src/index.js'
import { events } from '../../../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('legacy runtime links', () => {
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
        expect(typeof addLink).toBe('function')
        expect(typeof addIssue).toBe('function')
        expect(typeof addTestId).toBe('function')
    })

    it('adds links', async () => {
        vi.mocked(process.emit).mockClear()

        await addLink('http://example.org', 'Example', 'custom')
        await addIssue('1')
        await addTestId('1')

        expect(process.emit).toHaveBeenCalledTimes(3)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.runtimeMessage, {
            type: 'metadata',
            data: {
                links: [{ name: 'Example', url: 'http://example.org', type: 'custom' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(2, events.runtimeMessage, {
            type: 'metadata',
            data: {
                links: [{ url: '1', type: LinkType.ISSUE }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(3, events.runtimeMessage, {
            type: 'metadata',
            data: {
                links: [{ url: '1', type: LinkType.TMS }]
            }
        })
    })
})
