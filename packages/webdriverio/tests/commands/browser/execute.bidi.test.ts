import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

import { execute } from '../../../src/commands/browser/execute.js'
import { LocalValue } from '../../../src/utils/bidi/value.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/context.js', () => ({
    getContextManager: () => ({ getCurrentContext: async () => 'context-1' })
}))

const bidiBrowser = () => ({
    isBidi: true,
    isMultiremote: false,
    scriptCallFunction: vi.fn().mockResolvedValue({ type: 'success', result: { type: 'null' } })
})

// v9 knows an element by the name of its constructor; an element has commands
function Element () {}
const element = (props: Record<string, unknown>) => Object.assign(Object.create(Element.prototype), props, { addCommand () {} })

// a $$() list: its forEach is async, as its other array methods
class ElementList extends Array {
    // @ts-expect-error an async forEach, as the one of an element list
    forEach () {
        return Promise.resolve()
    }
}

describe('execute BiDi element arguments', () => {
    it('passes an element as its reference', async () => {
        const browser = bidiBrowser()
        await execute.call(browser as unknown as WebdriverIO.Browser, (el: HTMLElement) => el, element({ selector: '.found', elementId: 'el-1', [ELEMENT_KEY]: 'el-1' }) as never)

        expect(browser.scriptCallFunction.mock.calls[0][0].arguments).toEqual([
            LocalValue.getArgument({ [ELEMENT_KEY]: 'el-1' }).asMap()
        ])
    })

    it('throws that an element that was not found can not be passed, as in Classic', async () => {
        const browser = bidiBrowser()
        const missing = element({ selector: '.missing', error: new Error('no such element') })

        await expect(execute.call(browser as unknown as WebdriverIO.Browser, (el: HTMLElement) => el, missing as never))
            .rejects.toThrow('The element with selector ".missing" you are trying to pass into the execute method wasn\'t found')
        expect(browser.scriptCallFunction).not.toHaveBeenCalled()
    })

    it('passes every item of a $$() list', async () => {
        const browser = bidiBrowser()
        const list = ElementList.from([
            element({ selector: 'p', elementId: 'p-1', [ELEMENT_KEY]: 'p-1' }),
            element({ selector: 'p', elementId: 'p-2', [ELEMENT_KEY]: 'p-2' })
        ])
        await execute.call(browser as unknown as WebdriverIO.Browser, (els: HTMLElement[]) => els, list as never)

        expect(browser.scriptCallFunction.mock.calls[0][0].arguments).toEqual([
            LocalValue.getArgument([{ [ELEMENT_KEY]: 'p-1' }, { [ELEMENT_KEY]: 'p-2' }]).asMap()
        ])
    })
})
