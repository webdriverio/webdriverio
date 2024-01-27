import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { expect, describe, it, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('elem.react$', () => {
    it('does request to get React component with correct params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        const options = {
            props: { some: 'props' },
            state: true
        }
        await elem.react$$('MyComp', options)
        expect(elem.elementId).toBe('some-elem-123')
        expect(vi.mocked(got).mock.calls.pop()![1]!.json.args)
            .toEqual([
                'MyComp',
                { some: 'props' },
                true,
                {
                    ELEMENT: elem.elementId,
                    [ELEMENT_KEY]: elem.elementId
                },
            ])
    })

    it('does request to get React component with default params', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        await elem.react$$('MyComp')
        expect(elem.elementId).toBe('some-elem-123')
        expect(vi.mocked(got).mock.calls.pop()![1]!.json.args).toEqual([
            'MyComp',
            {},
            {},
            {
                ELEMENT: elem.elementId,
                [ELEMENT_KEY]: elem.elementId
            },
        ])
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
            (
                await elems.filter(elem => Boolean(elem.isReactElement))
            ).length
        ).toBe(3)
        expect(elems.foundWith).toBe('react$$')
    })
})
