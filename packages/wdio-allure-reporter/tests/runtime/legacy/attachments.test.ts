import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'
import { clean } from '../../helpers/wdio-allure-helper.js'
import AllureReporter, {
    addAttachment,
} from '../../../src/index.js'
import { events } from '../../../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

beforeEach(() => {
    vi.resetAllMocks()
})

describe('legacy runtime attachment', () => {
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
        expect(typeof addAttachment).toBe('function')
    })

    it('adds attachments', async () => {
        vi.mocked(process.emit).mockClear()

        await addAttachment('Attachment', 'content', 'text/plain')

        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenNthCalledWith(1, events.runtimeMessage, {
            type: 'attachment_content',
            data: expect.objectContaining({
                name: 'Attachment',
                content: Buffer.from('content', 'utf8').toString('base64'),
                encoding: 'base64',
                contentType: 'text/plain',
            })
        })
    })
})
