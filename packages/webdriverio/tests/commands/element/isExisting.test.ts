import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { bidiGetTagName, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiGetTagName: vi.fn() }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('isExisting test', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should allow to check if an element is enabled', async () => {
        const elem = await browser.$('#foo')
        await elem.isExisting()
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ pathname: '/session/foobar-123/elements' }),
            expect.anything()
        )
    })

    it('should allow to check an react element', async () => {
        const elem = await browser.react$('#foo')
        await elem.isExisting()
        expect(fetch).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({ pathname: '/session/foobar-123/execute/sync' }),
            expect.anything()
        )
    })

    it('should use getElementTagName if no selector is available', async () => {
        const elem = await browser.$({ 'element-6066-11e4-a52e-4f735466cecf': 'someId' })
        expect(await elem.isExisting()).toBe(true)
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ pathname: expect.stringMatching(/\/element\/someId\/name$/) }),
            expect.anything()
        )
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    describe('with BiDi commands enabled', () => {
        afterEach(() => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
        })

        it('probes an element without selector through BiDi', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
            vi.mocked(bidiGetTagName).mockReset().mockResolvedValue('div')
            const elem = await browser.$({ 'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123' } as never)
            vi.mocked(fetch).mockClear()
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            expect(await elem.isExisting()).toBe(true)
            expect(bidiGetTagName).toHaveBeenCalled()
            expect(vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname).filter((p) => p.endsWith('/name'))).toEqual([])
        })
    })
})
