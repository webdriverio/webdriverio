import assert from 'node:assert/strict'
import os from 'node:os'

import { remote } from '../../packages/webdriverio/build/index.js'

const fixture = `
    <style>
        #target {
            --size: 11px;
            --Token: MiXeD;
            --token: lower;
            --number: 42;
            --text: "Hello  World";
            --color: rgb(1, 2, 3);
            width: 31px;
            font-size: 14px;
        }
        #target::before { content: ''; --size: 13px; display: block; width: 37px; }
        #target::after { content: ''; --size: 17px; display: block; width: 41px; }
    </style>
    <div id="target">Target</div>
`
const html = `${fixture}<iframe srcdoc="${fixture.replace(/"/g, '&quot;')}"></iframe>`
const properties = ['--size', '--Token', '--token', '--number', '--text', '--color', '--missing']

async function checkProperties (element, label) {
    for (const [pseudo, size, width] of [[null, '11px', '31px'], ['::before', '13px', '37px'], ['::after', '17px', '41px']]) {
        assert.equal((await element.getCSSProperty('width', pseudo ?? undefined)).value, width)
        if (pseudo) {
            assert.equal((await element.getCSSProperty('fontSize', pseudo)).value, '14px')
        }
        for (const name of properties) {
            const expected = await element.execute((el, name, pseudo) => (
                getComputedStyle(el, pseudo).getPropertyValue(name)
            ), name, pseudo)
            if (name === '--size') {
                assert.equal(expected, size)
            }
            assert.deepEqual(await element.getCSSProperty(name, pseudo ?? undefined), {
                property: name,
                value: expected,
                parsed: {}
            })
        }
    }
    console.log(`PASS ${label}: custom values, case-sensitive names, missing properties, pseudo-elements and regular CSS controls`)
}

for (const mode of ['classic', 'bidi', 'bidi-experimental']) {
    const browser = await remote({
        logLevel: 'error',
        capabilities: {
            browserName: 'chrome',
            ...(mode === 'classic'
                ? { 'wdio:enforceWebDriverClassic': true }
                : { webSocketUrl: true }),
            ...(mode === 'bidi-experimental' ? { 'wdio:experimentalBiDiCommands': true } : {}),
            ...(process.env.CHROMEDRIVER_BINARY ? {
                'wdio:chromedriverOptions': { binary: process.env.CHROMEDRIVER_BINARY, spawnOpts: { windowsHide: true } }
            } : {}),
            'goog:chromeOptions': {
                ...(process.env.CHROME_BINARY ? { binary: process.env.CHROME_BINARY } : {}),
                args: ['--headless=new', '--disable-gpu', ...(os.platform() === 'linux' || process.env.CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : [])]
            }
        }
    })
    try {
        console.log(`${mode}: Chrome ${browser.capabilities.browserVersion}`)
        assert.equal(browser.isBidi, mode !== 'classic')
        const page = await browser.url(`data:text/html,${encodeURIComponent(html)}`)
        await checkProperties(await browser.$('#target'), mode)
        if (browser.isBidi) {
            const frame = await page.frame({ url: 'about:srcdoc' })
            await checkProperties(await frame.$('#target'), `${mode} held frame`)
        }
    } finally {
        await browser.deleteSession()
    }
}
