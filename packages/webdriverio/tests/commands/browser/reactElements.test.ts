import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { expect, describe, it, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { react$$ as react$$Script } from '../../../src/scripts/resq.js'

vi.mock('fetch')
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
        expect(fetch).toBeCalledTimes(4)
        expect(JSON.parse(vi.mocked(fetch).mock.calls.pop()![1]!.body as any).args)
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
        expect(JSON.parse(vi.mocked(fetch).mock.calls.pop()![1]!.body as any).args).toEqual(['myComp', {}, {}])
    })

    it('should wait for React through Execute Async Script on a Classic session', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        vi.mocked(fetch).mockClear()
        await browser.react$$('myComp')
        const waitCalls = vi.mocked(fetch).mock.calls.filter(([, params]) => (
            (params?.body as string | undefined)?.includes('waitToLoadReact')
        ))
        expect(waitCalls.map(([uri]) => String(uri).split('/').slice(-2).join('/'))).toEqual(['execute/async'])
    })

    it('should call getElements with React flag true', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elems = await browser.react$$('myComp')

        expect(
            (await elems.filter(
                (elem) => Boolean(elem.isReactElement)
            )).length
        ).toBe(3)
        expect(elems.foundWith).toBe('react$$')
    })

    it('should query the list again with the same props and state', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elems = await browser.react$$('myComp', {
            props: { some: 'props' },
            state: { some: 'state' }
        })
        /**
         * expect-webdriverio queries a list again with `parent[foundWith](selector, ...props)`
         */
        const parent = elems.parent as unknown as Record<string, (...args: unknown[]) => WebdriverIO.ElementArray>
        await parent[elems.foundWith](elems.selector, ...elems.props)

        expect(JSON.parse(vi.mocked(fetch).mock.calls.pop()![1]!.body as any).args)
            .toEqual(['myComp', { some: 'props' }, { some: 'state' }])
    })

    it('should query with the same props and state for an index past the end', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const isQuery = (script: unknown) => script === react$$Script
        let queries = 0
        const execute = vi.spyOn(browser, 'execute').mockImplementation((async (script: unknown) => (
            isQuery(script)
                ? Array.from(
                    { length: ++queries > 1 ? 2 : 1 },
                    (_, index) => ({ 'element-6066-11e4-a52e-4f735466cecf': `elem-${index}` })
                )
                : undefined
        )) as any)

        const elems = await browser.react$$('myComp', {
            props: { some: 'props' },
            state: { some: 'state' }
        })
        expect(elems).toHaveLength(1)

        await expect(elems[1].elementId).resolves.toBe('elem-1')
        expect(execute.mock.calls.filter(([script]) => isQuery(script)).map(([, ...args]) => args)).toEqual([
            ['myComp', { some: 'props' }, { some: 'state' }],
            ['myComp', { some: 'props' }, { some: 'state' }]
        ])
    })
})
