import { describe, expect, it, vi } from 'vitest'

import AiService from '../src/service.js'

describe('AiService', () => {
    it('adds act to the browser, its elements and its browsing contexts', () => {
        const browser = { addCommand: vi.fn() } as unknown as WebdriverIO.Browser
        const service = new AiService({ model: 'anthropic:claude-sonnet-5-5' })
        service.before({}, [], browser)

        expect(browser.addCommand).toHaveBeenCalledTimes(3)
        expect(browser.addCommand).toHaveBeenNthCalledWith(1, 'act', expect.any(Function))
        expect(browser.addCommand).toHaveBeenNthCalledWith(2, 'act', expect.any(Function), { attachToElement: true })
        expect(browser.addCommand).toHaveBeenNthCalledWith(3, 'act', expect.any(Function), { attachToBrowsingContext: true })
    })

    it('runs the command on the scope it was called on', async () => {
        const commands: Function[] = []
        const browser = { addCommand: vi.fn((_name: string, fn: Function) => commands.push(fn)) } as unknown as WebdriverIO.Browser
        const service = new AiService()
        const act = vi.spyOn(service.runtime, 'act').mockResolvedValue({ source: 'model', steps: [] })
        service.before({}, [], browser)

        const element = { elementId: 'el-1' }
        await commands[1].call(element, 'Open the menu', { timeout: 5000 })
        expect(act).toHaveBeenCalledWith(element, 'Open the menu', { timeout: 5000 })
    })
})
