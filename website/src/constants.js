import React from 'react'
import Link from '@docusaurus/Link'
import Translate, { translate } from '@docusaurus/Translate'

export const features = [{
    icon: '🌎',
    title: translate({
        id: 'features.realEnvironments',
        message: 'Test in Real Environments'
    }),
    description: (
        <Translate>
            WebdriverIO allows you to test in actual browser or mobile devices used by your users.
        </Translate>
    ),
},
{
    icon: '🔩',
    title: translate({
        id: 'features.versatile',
        message: 'Versatile and Feature Rich'
    }),
    description: (
        <Translate>
            Use WebdriverIO for full e2e or unit and component testing in the browser.
        </Translate>
    ),
}, {
    icon: '💤',
    title: translate({
        id: 'features.autoWait',
        message: 'Auto Wait'
    }),
    description: (
        <Translate>
            WebdriverIO automatically waits for elements to appear before interacting with them.
        </Translate>
    ),
}, {
    icon: '📒',
    title: translate({
        id: 'features.standards',
        message: 'Based on Web Standards'
    }),
    description: (
        <Translate
            id="homepage.features.crossBrowser"
            values={{
                webdriverLink: (
                    <Link to="https://w3c.github.io/webdriver/">WebDriver</Link>
                ),
                bidiLink: (
                    <Link to="https://w3c.github.io/webdriver-bidi/">WebDriver Bidi</Link>
                )
            }}>
            {'Cross browser support via automation through {webdriverLink} and {bidiLink}.'}
        </Translate>
    ),
}, {
    icon: '📱',
    title: translate({
        id: 'features.mobileSupport',
        message: 'Native Mobile Support'
    }),
    description: (
        <Translate
            id="homepage.features.mobile"
            values={{
                appiumLink: (
                    <Link to="https://appium.io/">Appium</Link>
                )
            }}>
            {'Run WebdriverIO on real mobile devices, smart TVs or other IoT devices through {appiumLink}.'}
        </Translate>
    ),
}, {
    icon: '🫂',
    title: translate({
        id: 'features.community',
        message: 'Committed Community'
    }),
    description: (
        <Translate
            id="homepage.features.support"
            values={{
                supportChannelLink: (
                    <Link to="https://discord.webdriver.io">support channel</Link>
                )
            }}>
            {'Running a {supportChannelLink} with over 8k members and a rich ecosystem of community maintained plugins.'}
        </Translate>
    ),
}]

export const logos = [{
/**
 * Page 1
 */
    img: 'google.png',
    alt: 'Google',
    url: 'https://developers.google.com/blockly/'
}, {
    img: 'netflix.png',
    alt: 'Netflix',
    url: 'https://netflix.com/'
}, {
    img: 'microsoft.svg',
    alt: 'Microsoft',
    url: 'https://www.microsoft.com/'
}, {
    img: 'mozilla.png',
    alt: 'Mozilla',
    url: 'https://www.mozilla.org/'
}, {
    img: 'buoyant.png',
    alt: 'Buoyant',
    url: 'https://buoyant.io/'
}, {
    img: 'sap.png',
    alt: 'SAP',
    url: 'https://www.sap.com/'
}, {
    img: 'salesforce.png',
    alt: 'Salesforce',
    url: 'https://engineering.salesforce.com/'
}, {
    img: 'hilton.png',
    alt: 'Hilton',
    url: 'https://www.hilton.com/'
},
/**
 * Page 2
 */
{
    img: 'schwab.png',
    alt: 'Charles Schwab',
    url: 'https://www.schwab.com/'
}, {
    img: 'jwplayer.png',
    alt: 'JW Player',
    url: 'https://www.jwplayer.com/'
}, {
    img: 'bbva.png',
    alt: 'BBVA',
    url: 'https://www.bbva.com/'
}, {
    img: 'gopro.png',
    alt: 'GoPro',
    url: 'https://gopro.com/'
}, {
    img: 'algolia.png',
    alt: 'Algolia',
    url: 'https://www.algolia.com/'
},
/**
 * Page 3
 */
{
    img: 'financialtimes.png',
    alt: 'Financial Times',
    url: 'https://www.ft.com/'
}, {
    img: 'zendesk.png',
    alt: 'Zendesk',
    url: 'https://www.zendesk.com/'
}, {
    img: '1und1.png',
    alt: '1&1',
    url: 'https://www.1und1.de/'
}, {
    img: 'avira.png',
    alt: 'Avira',
    url: 'https://www.avira.com/'
}, {
    img: 'deloitte.jpg',
    alt: 'Deloitte',
    url: 'https://deloitte.com'
}, {
    img: 'rabobank.png',
    alt: 'Rabobank',
    url: 'https://www.rabobank.com/'
},
/**
 * Page 4
 */
{
    img: 'bedrock.jpg',
    alt: 'Bedrock Streaming',
    url: 'https://www.bedrockstreaming.com/'
}]

export const LHIntregrationExample = `
await browser.emulateDevice('iPhone X')
await browser.enablePerformanceAudits({
    networkThrottling: 'Good 3G',
    cacheEnabled: true,
    formFactor: 'mobile'
})

// open application under test
await browser.url('https://localhost:3000')

expect(await browser.getMetrics().firstMeaningfulPaint)
    .toBeBelow(2500)

const pwaCheckResult = await browser.checkPWA()
expect(pwaCheckResult.passed).toBe(true)
`

export const SetupExample = `
$ npm init wdio@latest ./
`

export const ComponentTestingExample = `
import { $, expect } from '@wdio/globals'
import { render } from '@testing-library/vue'
import HelloWorld from '../../src/components/HelloWorld.vue'

describe('Vue Component Testing', () => {
    it('increments value on click', async () => {
        const { getByText } = render(HelloWorld)
        const btn = getByText('count is 0')

        // transform into WebdriverIO element
        const button = await $(btn)
        await button.click()
        await button.click()

        getByText('count is 2')
        await expect($('button=count is 2')).toExist()
    })
})`
