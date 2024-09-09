import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { clean } from '../../helpers/wdio-allure-helper.js'
import AllureReporter, { addStep, } from '../../../src/index.js'
import { Status } from 'allure-js-commons'
import { events } from '../../../build/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('legacy runtime steps', () => {
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
        expect(typeof addStep).toBe('function')
    })

    it('adds steps without attachment', async () => {
        vi.mocked(process.emit).mockClear()

        await addStep('Step')

        expect(process.emit).toHaveBeenCalledTimes(2)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.startStep, 'Step')
        expect(process.emit).toHaveBeenNthCalledWith(2, events.endStep, Status.PASSED)
    })

    it('adds steps with attachment', async () => {
        vi.mocked(process.emit).mockClear()

        await addStep(
            'Step',
            {
                name: 'Title',
                content: 'content'
            },
            Status.PASSED,
        )

        expect(process.emit).toHaveBeenCalledTimes(3)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.startStep, 'Step')
        expect(process.emit).toHaveBeenNthCalledWith(2, events.runtimeMessage, {
            type: 'attachment_content',
            data: expect.objectContaining({
                name: 'Title',
                content: Buffer.from('content', 'utf8').toString('base64'),
                encoding: 'base64',
                contentType: 'text/plain',
            })
        })
        expect(process.emit).toHaveBeenNthCalledWith(3, events.endStep, Status.PASSED)
    })

    it('throws an error when status is wrong', async () => {
        vi.mocked(process.emit).mockClear()

        // @ts-ignore
        expect(() => addStep('Step', undefined, 'invalid')).rejects.toThrow()
    })
})
