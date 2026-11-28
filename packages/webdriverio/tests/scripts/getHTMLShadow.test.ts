/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import getHTMLShadow from '../../src/scripts/getHTMLShadow.js'

describe('getHTMLShadow script', () => {
    it('marks the shadow hosts in the HTML it returns, not in the page', () => {
        document.body.innerHTML = '<div id="w"><open-host id="oh"><span>light</span></open-host></div>'
        const host = document.getElementById('oh')!
        const shadow = host.attachShadow({ mode: 'open' })
        shadow.innerHTML = '<b>open</b>'
        const wrapper = document.getElementById('w')!

        const result = getHTMLShadow(wrapper, true, [['host', host, shadow as unknown as HTMLElement]])

        expect(result.html).toContain('data-wdio-shadow-id="host"')
        expect(result.shadowElementHTML).toEqual([{ id: 'host', html: '<b>open</b>', styles: [] }])
        expect(host.hasAttribute('data-wdio-shadow-id')).toBe(false)
        expect(wrapper.outerHTML).not.toContain('data-wdio-shadow-id')
    })
})
