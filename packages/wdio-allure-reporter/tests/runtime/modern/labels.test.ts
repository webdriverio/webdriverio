import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LabelName, epic, owner, suite, subSuite, parentSuite, tag, feature, label, severity, story, allureId } from 'allure-js-commons'
import { temporaryDirectory } from 'tempy'
import { clean } from '../../helpers/wdio-allure-helper.js'
import AllureReporter from '../../../src/index.js'
import { events } from '../../../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('modern runtime labels', () => {
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

    it('adds labels', async () => {
        vi.mocked(process.emit).mockClear()

        await label('foo', 'bar')
        await owner('owner')
        await severity('critical')
        await tag('tag')
        await epic('epic')
        await feature('feature')
        await story('story')
        await suite('suite')
        await subSuite('subSuite')
        await parentSuite('parentSuite')
        await story('story')

        expect(process.emit).toHaveBeenCalledTimes(11)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: 'foo', value: 'bar' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(2, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.OWNER, value: 'owner' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(3, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.SEVERITY, value: 'critical' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(4, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.TAG, value: 'tag' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(5, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.EPIC, value: 'epic' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(6, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.FEATURE, value: 'feature' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(7, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.STORY, value: 'story' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(8, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.SUITE, value: 'suite' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(9, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.SUB_SUITE, value: 'subSuite' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(10, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.PARENT_SUITE, value: 'parentSuite' }]
            }
        })
        expect(process.emit).toHaveBeenNthCalledWith(11, events.runtimeMessage, {
            type: 'metadata',
            data: {
                labels: [{ name: LabelName.STORY, value: 'story' }]
            }
        })
    })
})
