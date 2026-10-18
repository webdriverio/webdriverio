import path from 'node:path'

import { expect, describe, it, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

import { execute } from '../../../src/commands/browser/execute.js'
import { executeAsync } from '../../../src/commands/browser/executeAsync.js'
import { enhanceElementsArray } from '../../../src/utils/index.js'
import { LocalValue } from '../../../src/utils/bidi/value.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/session/context.js', () => ({
    getContextManager: () => ({ getCurrentContext: async () => 'context-1' })
}))

const bidiBrowser = () => ({
    isBidi: true,
    scriptCallFunction: vi.fn().mockResolvedValue({ type: 'success', result: { type: 'null' } })
})

// v9 knows an element by the name of its constructor; an element has commands
function Element () {}
const element = (props: Record<string, unknown>) => Object.assign(Object.create(Element.prototype), props, { addCommand () {} })

// a $$() list, as $$() makes it: its forEach is async, as its other array methods
const elementList = (elements: unknown[]) => enhanceElementsArray(elements as WebdriverIO.Element[], {} as WebdriverIO.Browser, 'p')

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
        const list = elementList([
            element({ selector: 'p', elementId: 'p-1', [ELEMENT_KEY]: 'p-1' }),
            element({ selector: 'p', elementId: 'p-2', [ELEMENT_KEY]: 'p-2' })
        ])
        await execute.call(browser as unknown as WebdriverIO.Browser, (els: HTMLElement[]) => els, list as never)

        expect(browser.scriptCallFunction.mock.calls[0][0].arguments).toEqual([
            LocalValue.getArgument([{ [ELEMENT_KEY]: 'p-1' }, { [ELEMENT_KEY]: 'p-2' }]).asMap()
        ])
    })
})

describe('executeAsync BiDi element arguments', () => {
    it('throws that an element that was not found can not be passed, as in Classic', async () => {
        const browser = bidiBrowser()
        const missing = element({ selector: '.missing', error: new Error('no such element') })

        await expect(executeAsync.call(browser as unknown as WebdriverIO.Browser, (el: HTMLElement, done: (r: unknown) => void) => done(el), missing as never))
            .rejects.toThrow('The element with selector ".missing" you are trying to pass into the execute method wasn\'t found')
        expect(browser.scriptCallFunction).not.toHaveBeenCalled()
    })

    it('passes every item of a $$() list', async () => {
        const browser = bidiBrowser()
        const list = elementList([
            element({ selector: 'p', elementId: 'p-1', [ELEMENT_KEY]: 'p-1' }),
            element({ selector: 'p', elementId: 'p-2', [ELEMENT_KEY]: 'p-2' })
        ])
        await executeAsync.call(browser as unknown as WebdriverIO.Browser, (els: HTMLElement[], done: (r: unknown) => void) => done(els), list as never)

        expect(browser.scriptCallFunction.mock.calls[0][0].arguments).toEqual([
            LocalValue.getArgument([{ [ELEMENT_KEY]: 'p-1' }, { [ELEMENT_KEY]: 'p-2' }]).asMap()
        ])
    })
})

describe('execute BiDi other arguments', () => {
    // an object without a prototype has no constructor
    it('passes an object without a prototype', async () => {
        const browser = bidiBrowser()
        const plain = Object.assign(Object.create(null), { a: 1 })
        await execute.call(browser as unknown as WebdriverIO.Browser, (o: unknown) => o, plain as never)

        expect(browser.scriptCallFunction.mock.calls[0][0].arguments).toEqual([LocalValue.getArgument(plain).asMap()])
    })
})
