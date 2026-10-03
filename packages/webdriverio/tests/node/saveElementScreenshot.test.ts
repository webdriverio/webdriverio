import fs from 'node:fs/promises'
import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'

import { ELEMENT_KEY } from 'webdriver'

import '../../src/node.js'
import { remote } from '../../src/index.js'
import { getBrowsingContext } from '../../src/browsingContext.js'
import { getElement } from '../../src/utils/getElementObject.js'

vi.mock('fetch')
vi.mock('fs/promises')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../src/session/context.js', () => ({
    getContextManager: vi.fn().mockImplementation(() => ({
        initialize: vi.fn(),
        getCurrentContext: vi.fn().mockResolvedValue('top-context'),
        setCurrentContext: vi.fn(),
        findParentContext: vi.fn().mockReturnValue(undefined),
        findContext: vi.fn()
    }))
}))

describe('saveElementScreenshot', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fs.access).mockResolvedValue()
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'bidi' }
        })
    })

    it('clips a capture of the top-level context for an element of a held frame', async () => {
        const page = getBrowsingContext(browser, 'top-context', { isFrame: false, url: 'https://example.com' })
        const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://example.com/frame', parent: page })
        const elem = getElement.call(frame, '#box', { [ELEMENT_KEY]: 'elem-1' })
        const iframe = getElement.call(page, 'iframe', { [ELEMENT_KEY]: 'iframe-1' })

        vi.spyOn(frame, 'execute')
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce({ x: 10, y: 20, width: 120, height: 30 })
        vi.spyOn(page, '$$').mockResolvedValue([iframe] as never)
        vi.spyOn(page, 'execute')
            .mockResolvedValueOnce({ context: 'frame-1' })
            .mockResolvedValueOnce({ x: 100, y: 200, width: 500, height: 300 })
            .mockResolvedValueOnce({ x: 0, y: 50 })
        const capture = vi.spyOn(browser, 'browsingContextCaptureScreenshot').mockResolvedValue({ data: Buffer.from('png').toString('base64') })

        const screenshot = await elem.saveScreenshot('./box.png')
        expect(screenshot.toString()).toBe('png')
        expect(capture).toHaveBeenCalledWith({
            context: 'top-context',
            origin: 'document',
            clip: { type: 'box', x: 110, y: 270, width: 120, height: 30 }
        })
    })

    it('keeps classic Take Element Screenshot for the current context', async () => {
        const elem = getElement.call(browser, '#box', { [ELEMENT_KEY]: 'elem-1' })
        const classic = vi.spyOn(elem, 'takeElementScreenshot').mockResolvedValue(Buffer.from('png').toString('base64'))
        const capture = vi.spyOn(browser, 'browsingContextCaptureScreenshot')

        await elem.saveScreenshot('./box.png')
        expect(classic).toHaveBeenCalledWith('elem-1')
        expect(capture).not.toHaveBeenCalled()
    })
})
