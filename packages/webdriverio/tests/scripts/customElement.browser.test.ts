import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

import customElementWrapperSource from '../../src/scripts/customElement.js'

/**
 * the wrapper runs from its source, like `script.addPreloadScript` sends it
 */
const customElementWrapper = new Function(`return (${customElementWrapperSource.toString()})`)() as typeof customElementWrapperSource

type HTMLUnsafe = { setHTMLUnsafe (html: string): void }
const origAttachShadow = Element.prototype.attachShadow
const origElementSetHTMLUnsafe = (Element.prototype as unknown as HTMLUnsafe).setHTMLUnsafe
const origShadowRootSetHTMLUnsafe = (ShadowRoot.prototype as unknown as HTMLUnsafe).setHTMLUnsafe
/**
 * parse HTML with the browser's own `setHTMLUnsafe`, as the HTML parser does
 * for declarative shadow roots, without the wrapper
 */
const parse = (target: Element | ShadowRoot, html: string) => origElementSetHTMLUnsafe.call(target as Element, html)

describe('customElement script', () => {
    let debug: MockInstance<typeof console.debug>
    /**
     * ids of the hosts reported with `newShadowRoot`, in the order of the reports
     */
    const reportedHosts = () => debug.mock.calls
        .filter(([prefix, event]) => prefix === '[WDIO]' && event === 'newShadowRoot')
        .map(([, , host]) => (host as Element).id)

    beforeEach(() => {
        document.body.innerHTML = ''
        debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    afterEach(() => {
        debug.mockRestore()
        Element.prototype.attachShadow = origAttachShadow
        ;(Element.prototype as unknown as HTMLUnsafe).setHTMLUnsafe = origElementSetHTMLUnsafe
        ;(ShadowRoot.prototype as unknown as HTMLUnsafe).setHTMLUnsafe = origShadowRootSetHTMLUnsafe
        delete (customElements as { define?: unknown }).define
        Reflect.deleteProperty(document, 'readyState')
    })

    it('reports the open declarative shadow roots of the document, parents first', () => {
        parse(document.body, `
            <div id="outer"><template shadowrootmode="open">
                <section id="nested"><template shadowrootmode="open"><span>nested</span></template></section>
            </template></div>
            <x-undefined id="undefined"><template shadowrootmode="open"><span>undefined</span></template></x-undefined>
            <div id="closed"><template shadowrootmode="closed"><span>closed</span></template></div>
            <div id="light"><span>light</span></div>
        `)

        customElementWrapper()

        expect(reportedHosts()).toEqual(['outer', 'nested', 'undefined'])
        const outer = document.getElementById('outer')!
        const [, , , outerRoot, outerIsDocument, documentElement] = debug.mock.calls[0]
        expect(outerRoot).toBe(document)
        expect(outerIsDocument).toBe(true)
        expect(documentElement).toBe(document.documentElement)
        const [, , , nestedRoot, nestedIsDocument] = debug.mock.calls[1]
        expect(nestedRoot).toBe(outer.shadowRoot)
        expect(nestedIsDocument).toBe(false)
    })

    it('waits for DOMContentLoaded while the document is still loading', () => {
        Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
        customElementWrapper()
        parse(document.body, '<div id="host"><template shadowrootmode="open"><span>in shadow</span></template></div>')
        expect(reportedHosts()).toEqual([])

        document.dispatchEvent(new Event('DOMContentLoaded'))
        expect(reportedHosts()).toEqual(['host'])
    })

    it('does not report a host twice when attachShadow already reported it', () => {
        Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
        customElementWrapper()
        const host = document.createElement('div')
        host.id = 'imperative'
        document.body.append(host)
        host.attachShadow({ mode: 'open' }).innerHTML = '<span>in shadow</span>'
        parse(document.body.appendChild(document.createElement('div')), '<p id="declarative"><template shadowrootmode="open"></template></p>')

        document.dispatchEvent(new Event('DOMContentLoaded'))
        expect(reportedHosts()).toEqual(['imperative', 'declarative'])
    })

    it('reports a custom element again when it got its shadow root after connectedCallback', () => {
        Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
        customElementWrapper()
        customElements.define('x-early-defined', class extends HTMLElement {})
        const host = document.createElement('x-early-defined')
        host.id = 'early'
        document.body.append(host)
        /**
         * the parser attaches the declarative shadow root of a defined custom
         * element after its connectedCallback ran (seen in Firefox)
         */
        origAttachShadow.call(host, { mode: 'open' })
        expect(reportedHosts()).toEqual(['early'])

        document.dispatchEvent(new Event('DOMContentLoaded'))
        expect(reportedHosts()).toEqual(['early', 'early'])
    })

    it('reports declarative shadow roots that setHTMLUnsafe adds to a connected node', () => {
        customElementWrapper()
        const container = document.body.appendChild(document.createElement('div'))
        ;(container as unknown as HTMLUnsafe).setHTMLUnsafe('<div id="in-element"><template shadowrootmode="open"><span>a</span></template></div>')

        const host = document.body.appendChild(document.createElement('div'))
        host.id = 'imperative'
        const shadowRoot = host.attachShadow({ mode: 'open' })
        ;(shadowRoot as unknown as HTMLUnsafe).setHTMLUnsafe('<div id="in-shadow-root"><template shadowrootmode="open"><span>b</span></template></div>')

        expect(reportedHosts()).toEqual(['in-element', 'imperative', 'in-shadow-root'])
        const [, , , root] = debug.mock.calls[2]
        expect(root).toBe(shadowRoot)
    })

    it('does not report shadow roots that setHTMLUnsafe adds to a detached node', () => {
        customElementWrapper()
        const detached = document.createElement('div')
        ;(detached as unknown as HTMLUnsafe).setHTMLUnsafe('<div id="detached"><template shadowrootmode="open"><span>a</span></template></div>')

        expect(detached.querySelector('#detached')!.shadowRoot).not.toBeNull()
        expect(reportedHosts()).toEqual([])
    })
})
