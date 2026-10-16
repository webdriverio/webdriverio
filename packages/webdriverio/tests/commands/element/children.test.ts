import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { children, type ChildrenOptions } from '../../../src/commands/element/children.js'
import { $$ } from '../../../src/commands/browser/$$.js'

vi.mock('../../../src/commands/browser/$$.js', () => ({ $$: vi.fn() }))

describe('children', () => {
    let dom: JSDOM
    let host: HTMLElement

    beforeEach(() => {
        dom = new JSDOM('<div id="host">text<!--comment--><p id="first"><b id="nested"></b></p><p id="second"></p></div>')
        host = dom.window.document.querySelector<HTMLElement>('#host')!
        vi.mocked($$).mockImplementation((selector) => (
            (selector as unknown as (this: HTMLElement) => Element[]).call(host) as unknown as WebdriverIO.ElementArray
        ))
    })

    afterEach(() => dom.window.close())

    const query = (options?: ChildrenOptions) => {
        return children.call({} as WebdriverIO.Element, options) as unknown as Element[]
    }

    it('returns only direct light DOM elements in order', () => {
        expect(query().map(el => el.id)).toEqual(['first', 'second'])
    })

    it('keeps light DOM children as the default on a shadow host', () => {
        host.attachShadow({ mode: 'open' }).innerHTML = '<p id="shadow"></p>'
        expect(query().map(el => el.id)).toEqual(['first', 'second'])
        expect(query({ withinShadowRoot: false }).map(el => el.id)).toEqual(['first', 'second'])
    })

    it('returns only direct open shadow root elements when requested', () => {
        host.attachShadow({ mode: 'open' }).innerHTML = 'text<!--comment--><p id="shadow"><b id="nested-shadow"></b></p>'
        expect(query({ withinShadowRoot: true }).map(el => el.id)).toEqual(['shadow'])
    })

    it('returns no elements for a missing or closed shadow root', () => {
        expect(query({ withinShadowRoot: true })).toEqual([])
        host.attachShadow({ mode: 'closed' }).innerHTML = '<p></p>'
        expect(query({ withinShadowRoot: true })).toEqual([])
    })

    it('returns an empty list for a leaf element', () => {
        host = dom.window.document.querySelector<HTMLElement>('#nested')!
        expect(query()).toEqual([])
    })
})
