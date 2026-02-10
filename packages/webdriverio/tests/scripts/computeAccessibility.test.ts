import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'

import computeAccessibilityLookup from '../../src/scripts/computeAccessibility.js'

describe('computeAccessibilityLookup', () => {
    let dom: JSDOM
    let document: Document

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
        document = dom.window.document
        global.document = document
        global.window = dom.window as any
        global.HTMLElement = dom.window.HTMLElement
        global.HTMLInputElement = dom.window.HTMLInputElement
        global.HTMLSelectElement = dom.window.HTMLSelectElement
        global.NodeList = dom.window.NodeList
        global.CSS = {
            escape: (s: string) => s.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1'),
            supports: () => false
        } as any
    })

    afterEach(() => {
        // @ts-ignore
        delete global.document
        // @ts-ignore
        delete global.window
        // @ts-ignore
        delete global.HTMLElement
        // @ts-ignore
        delete global.HTMLInputElement
        // @ts-ignore
        delete global.HTMLSelectElement
        // @ts-ignore
        delete global.NodeList
        // @ts-ignore
        delete global.CSS
    })

    it('should find element by accessible name', () => {
        document.body.innerHTML = `
            <button>Submit</button>
            <button>Cancel</button>
        `

        const result = computeAccessibilityLookup('Submit', null, {
            strict: false,
            candidateCap: 100,
            includeHidden: false
        })

        expect(result.elements).toHaveLength(1)
        expect(result.elements[0].textContent).toBe('Submit')
    })

    it('should find element by accessible name and role', () => {
        document.body.innerHTML = `
            <button>Submit</button>
            <div role="button">Submit</div>
            <div role="link">Submit</div>
        `

        const result = computeAccessibilityLookup('Submit', 'link', {
            strict: false,
            candidateCap: 100,
            includeHidden: false
        })

        expect(result.elements).toHaveLength(1)
        expect(result.elements[0].tagName).toBe('DIV')
        expect(result.elements[0].getAttribute('role')).toBe('link')
    })

    it('should return multiple elements if strict is false', () => {
        document.body.innerHTML = `
            <button>Submit</button>
            <div role="button">Submit</div>
        `

        const result = computeAccessibilityLookup('Submit', null, {
            strict: false,
            candidateCap: 100,
            includeHidden: false
        })

        expect(result.elements).toHaveLength(2)
    })

    it('should respect strict mode: return multiple candidates for caller verification', () => {
        document.body.innerHTML = `
            <button>Submit</button>
            <div role="button">Submit</div>
        `

        const result = computeAccessibilityLookup('Submit', null, {
            strict: true,
            candidateCap: 100,
            includeHidden: false
        })

        // The script is designed to return multiple matches even in strict mode
        // so that the caller (accessibilityLocator) can detect the ambiguity and throw the StrictSelectorError.
        // It stops searching deeper once >1 are found to save performance.
        expect(result.elements.length).toBeGreaterThanOrEqual(2)
    })

    it('should support aria-label', () => {
        document.body.innerHTML = '<div role="button" aria-label="Close">X</div>'
        const result = computeAccessibilityLookup('Close', null, { strict: false, candidateCap: 100, includeHidden: false })
        expect(result.elements).toHaveLength(1)
        expect(result.elements[0].textContent).toBe('X')
    })

    it('should support aria-labelledby', () => {
        document.body.innerHTML = `
            <h1 id="header">Section Title</h1>
            <div role="region" aria-labelledby="header">Content</div>
        `
        const result = computeAccessibilityLookup('Section Title', 'region', { strict: false, candidateCap: 100, includeHidden: false })
        expect(result.elements).toHaveLength(1)
    })

    it('should support label for input', () => {
        document.body.innerHTML = `
            <label for="username">User Name</label>
            <input id="username" />
        `
        const result = computeAccessibilityLookup('User Name', 'textbox', { strict: false, candidateCap: 100, includeHidden: false })
        expect(result.elements).toHaveLength(1)
        expect(result.elements[0].tagName).toBe('INPUT')
        expect(result.elements[0].id).toBe('username')
    })

    it('should respect document order', () => {
        document.body.innerHTML = `
            <div id="first" aria-label="Test">1</div>
            <button id="second">Test</button>
            <div id="third" role="button">Test</div>
        `
        const result = computeAccessibilityLookup('Test', null, { strict: false, candidateCap: 100, includeHidden: false })
        expect(result.elements).toHaveLength(3)
        expect(result.elements[0].id).toBe('first')
        expect(result.elements[1].id).toBe('second')
        expect(result.elements[2].id).toBe('third')
    })
})
