import React from 'react'

export const features = [{
    title: 'Extendable',
    description: (
        <>
            Adding helper functions, or more complicated sets and combinations
            of existing commands is <strong>simple</strong> and really <strong>useful</strong>
        </>
    ),
}, {
    title: 'Compatible',
    description: (
        <>
            WebdriverIO can be run on the <a href="https://w3c.github.io/webdriver/"><strong>WebDriver Protocol</strong></a> for
            true cross browser testing as well as <a href="https://chromedevtools.github.io/devtools-protocol/"><strong>Chrome DevTools Protocol</strong></a> for
            Chromium based automation using <a href="https://pptr.dev/">Puppeteer</a>.
        </>
    ),
},
{
    title: 'Feature Rich',
    description: (
        <>
            The huge variety of community plugins allows you to easily integrate
            and extend your setup to fulfill your requirements.
        </>
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
    img: 'microsoft.png',
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
},
/**
 * Page 2
 */
{
    img: 'hilton.png',
    alt: 'Hilton',
    url: 'https://www.hilton.com/'
}, {
    img: 'github.png',
    alt: 'GitHub',
    url: 'https://www.electronjs.org/spectron'
}, {
    img: 'oxford.png',
    alt: 'Oxford University Press',
    url: 'https://global.oup.com/'
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
}]

export const LHIntregrationExample = `browser.emulateDevice('iPhone X')
browser.enablePerformanceAudits({
    networkThrottling: 'Good 3G',
    cacheEnabled: true,
    formFactor: 'mobile'
})

// open application under test
browser.url('https://localhost:3000')

expect(browser.getMetrics().firstMeaningfulPaint).toBeBelow(2500)
const pwaCheckResult = browser.checkPWA()
expect(pwaCheckResult.passed).toBe(true)
`

export const SetupExample = `
$ npm install --save-dev @wdio/cli
$ npx wdio config --yes
$ npx wdio run
`
