import { describe, it, expect } from 'vitest'

import {
    PROTOCOL_NAMES,
    MOBILE_PROTOCOLS,
    VENDOR_PROTOCOLS,
    IGNORED_SUBPACKAGES_FOR_DOCS,
    PROTOCOLS,
    PROTOCOL_API_DESCRIPTION,
    EDIT_WARNING
} from '../src/protocols.js'

describe('protocol metadata', () => {
    it('lists every supported protocol display name', () => {
        expect(PROTOCOL_NAMES).toMatchObject({
            webdriver: 'WebDriver Protocol',
            webdriverBidi: 'WebDriver Bidi Protocol',
            appium: 'Appium'
        })
        expect(Object.keys(PROTOCOL_NAMES)).toEqual(Object.keys(PROTOCOLS))
    })

    it('classifies mobile and vendor protocols', () => {
        expect(MOBILE_PROTOCOLS).toEqual(['appium', 'mjsonwp'])
        expect(VENDOR_PROTOCOLS).toEqual(['chromium'])
    })

    it('skips internal smoke-test packages when generating docs', () => {
        expect(IGNORED_SUBPACKAGES_FOR_DOCS).toEqual([
            'eslint-plugin-wdio',
            'wdio-smoke-test-service',
            'wdio-smoke-test-reporter',
            'wdio-smoke-test-cjs-service'
        ])
    })

    it('loads official protocol command tables', () => {
        expect(Object.keys(PROTOCOLS.webdriver).length).toBeGreaterThan(0)
        expect(PROTOCOLS.webdriver['/session'] || PROTOCOLS.webdriver).toBeTruthy()
    })

    it('attaches extra API descriptions for Sauce and Bidi', () => {
        expect(PROTOCOL_API_DESCRIPTION.saucelabs).toContain('Extended Debugging')
        expect(PROTOCOL_API_DESCRIPTION.webdriverBidi).toContain('webSocketUrl: true')
    })

    it('points generated-file warnings at the docs templates', () => {
        expect(EDIT_WARNING).toContain('/infra/docs/src/templates/')
    })
})
