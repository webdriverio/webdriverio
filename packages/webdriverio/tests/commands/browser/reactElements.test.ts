import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { ELEMENT_KEY } from '../../../src/constants.js'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('react$', () => {
    it('should fetch an React component', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const options = {
            props: { some: 'props' },
            state: { some: 'state' }
        }
        const elems = await browser.react$$('myComp', options)

        expect(elems.length).toBe(3)
        expect(elems[0].elementId).toBe('some-elem-123')
        expect(elems[0][ELEMENT_KEY]).toBe('some-elem-123')
        expect(elems[0].ELEMENT).toBe(undefined)
        expect(elems[0].selector).toBe('myComp')
        expect(elems[0].index).toBe(0)
        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1][ELEMENT_KEY]).toBe('some-elem-456')
        expect(elems[1].ELEMENT).toBe(undefined)
        expect(elems[1].selector).toBe('myComp')
        expect(elems[1].index).toBe(1)
        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2][ELEMENT_KEY]).toBe('some-elem-789')
        expect(elems[2].ELEMENT).toBe(undefined)
        expect(elems[2].selector).toBe('myComp')
        expect(elems[2].index).toBe(2)
        expect(got).toBeCalledTimes(4)
        expect(vi.mocked(got).mock.calls.pop()![1]!.json.args)
            .toEqual(['myComp', { some: 'props' }, { some: 'state' }])
    })

    it('should default state and props to empty object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        await browser.react$$('myComp')
        expect(vi.mocked(got).mock.calls.pop()![1]!.json.args).toEqual(['myComp', {}, {}])
    })

    it('should call getElements with React flag true', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elems = await browser.react$$('myComp')

        expect(elems.filter((elem: WebdriverIO.Element) => elem.isReactElement
        ).length).toBe(3)
        expect(elems.foundWith).toBe('react$$')
    })
})
