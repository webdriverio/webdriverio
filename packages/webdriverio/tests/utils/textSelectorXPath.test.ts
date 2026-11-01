/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { findStrategy } from '../../src/utils/findStrategy.js'

const find = (selector: string, partialAttributeSelectors?: boolean) => {
    const { value } = findStrategy(selector, false, false, partialAttributeSelectors)
    const result = document.evaluate(value, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    return Array.from({ length: result.snapshotLength }, (_, i) => (result.snapshotItem(i) as Element).id)
}

describe('text selector XPath with #id and [attribute="value"]', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="save">OK</button>
            <button id="autosave">OK</button>
            <div id="row" data-test="row">Item</div>
            <div id="header" data-test="row-header">Item</div>
            <ul id="menu" role="menu"><li id="item" role="menuitem">Settings</li></ul>
        `
    })

    it('matches the exact id and attribute value, as CSS', () => {
        expect(find('button#save=OK')).toEqual(['save'])
        expect(find('div[data-test="row"]=Item')).toEqual(['row'])
        expect(find('[role="menu"]*=Settings')).toEqual(['menu'])
    })

    it('matches a part of the value with partialAttributeSelectors', () => {
        expect(find('button#save=OK', true)).toEqual(['save', 'autosave'])
        expect(find('div[data-test="row"]=Item', true)).toEqual(['row', 'header'])
        expect(find('[role="menu"]*=Settings', true)).toEqual(['item'])
    })
})
