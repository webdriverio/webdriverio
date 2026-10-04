/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { getAriaXPathSelector } from '../../src/utils/findStrategy.js'

const find = (label: string, root: Node = document) => {
    const result = document.evaluate(getAriaXPathSelector(label), root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    return Array.from({ length: result.snapshotLength }, (_, i) => (result.snapshotItem(i) as Element).id)
}

describe('aria XPath fallback', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('finds elements named by aria-labelledby and aria-describedby, also with several ids', () => {
        document.body.innerHTML = `
            <span id="name">Shipping address</span>
            <span id="other">Billing</span>
            <div id="single" aria-labelledby="name"></div>
            <div id="several" aria-labelledby="other name"></div>
            <div id="described" aria-describedby="name"></div>
            <div id="unrelated" aria-labelledby="other"></div>
        `
        expect(find('Shipping address')).toEqual(['name', 'single', 'several', 'described'])
    })

    it('finds inputs by their label, title and text', () => {
        document.body.innerHTML = `
            <label for="email">Email</label><input id="email">
            <label>Phone <input id="phone"></label>
            <iframe id="frame" title="Sign up"></iframe>
            <button id="button">Sign up</button>
        `
        expect(find('Email')).toEqual(['email'])
        expect(find('Sign up')).toEqual(['frame', 'button'])
    })
})
