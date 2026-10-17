import assert from 'node:assert/strict'
import { remote } from 'webdriverio'

const html = '<!doctype html><html><body><button id="submit" onclick="this.remove()">Submit<span class="loading">Loading</span></button></body></html>'
const absent = /not found|wasn't found|not.*displayed|not existing/

for (const webSocketUrl of [false, true]) {
    const implicitWaits = []
    let countWaits = false
    const browser = await remote({
        logLevel: 'error',
        waitforTimeout: 500,
        waitforInterval: 25,
        connectionRetryCount: 0,
        capabilities: {
            browserName: 'chrome',
            webSocketUrl,
            'wdio:enforceWebDriverClassic': !webSocketUrl,
            'wdio:chromedriverOptions': process.env.CHROMEDRIVER_BINARY
                ? { binary: process.env.CHROMEDRIVER_BINARY }
                : {},
            'goog:chromeOptions': {
                ...(process.env.CHROME_BINARY ? { binary: process.env.CHROME_BINARY } : {}),
                args: ['--headless=new']
            }
        }
    })
    const transport = browser.isBidi ? 'BiDi' : 'Classic'
    browser.overwriteCommand('waitForExist', function (original, ...args) {
        if (countWaits) {
            implicitWaits.push('waitForExist')
        }
        return original(...args)
    }, { attachToElement: true })
    let passed = 0
    async function check (name, test) {
        await browser.url('data:text/html,' + encodeURIComponent(html))
        await test()
        passed++
        console.log(`${transport}: ${name}`)
    }

    try {
        await check('new nested reverse wait after parent removal', async () => {
            await browser.$('#submit').click()
            assert.equal(await browser.execute(() => document.querySelector('#submit')), null)
            assert.equal(await browser.$('#submit').$('.loading').waitForDisplayed({ reverse: true }), true)
        })
        await check('cached nested reverse wait after parent removal', async () => {
            const child = await browser.$('#submit').$('.loading')
            assert.equal(await child.isDisplayed(), true)
            await browser.$('#submit').click()
            assert.equal(await child.waitForDisplayed({ reverse: true }), true)
        })
        await check('stale child actions retain one parent wait and its error', async () => {
            const child = await browser.$('#submit').$('.loading')
            await browser.$('#submit').click()
            implicitWaits.length = 0
            countWaits = true
            try {
                await assert.rejects(child.getText(), (error) => {
                    assert.equal(error.code, 'ELEMENT_NOT_FOUND_AGAIN')
                    assert.match(error.message, /Can't call \$ on element with selector "#submit" because element wasn't found/)
                    assert.ok(error.cause)
                    return true
                })
            } finally {
                countWaits = false
            }
            assert.equal(implicitWaits.length, 1)
        })
        await check('stale shadow host actions retain one parent wait and its error', async () => {
            await browser.execute(() => {
                document.body.innerHTML = '<div id="host"></div>'
                document.querySelector('#host').attachShadow({ mode: 'open' }).innerHTML = '<span class="loading">Shadow</span>'
            })
            const host = await browser.$('#host')
            await browser.execute(() => document.querySelector('#host').remove())
            implicitWaits.length = 0
            countWaits = true
            try {
                await assert.rejects(host.shadow$('.loading').getText(), (error) => {
                    assert.equal(error.code, 'ELEMENT_NOT_FOUND_AGAIN')
                    assert.match(error.message, /element with selector "#host" because element wasn't found/)
                    assert.ok(error.cause)
                    return true
                })
            } finally {
                countWaits = false
            }
            assert.equal(implicitWaits.length, 1)
        })
        await check('direct reverse wait after parent removal', async () => {
            await browser.$('#submit').click()
            assert.equal(await browser.$('.loading').waitForDisplayed({ reverse: true }), true)
        })
        await check('missing parent does not leak a matching outside child', async () => {
            await browser.$('#submit').click()
            await browser.execute(() => {
                document.body.innerHTML = '<button class="loading" onclick="window.outsideClicks=1">Outside</button>'
            })
            assert.equal(await browser.$('#submit').$('.loading').waitForDisplayed({ reverse: true }), true)
            await assert.rejects(browser.$('#submit').$('.loading').waitForDisplayed({ timeout: 100 }), absent)
            await assert.rejects(browser.$('#submit').$('.loading').click(), absent)
            assert.equal(await browser.execute(() => window.outsideClicks || 0), 0)
        })
        await check('positive wait finds an initially missing parent', async () => {
            await browser.$('#submit').click()
            await browser.execute(() => {
                setTimeout(() => {
                    document.body.innerHTML = '<div id="submit"><span class="loading">Late</span></div>'
                }, 100)
            })
            const child = browser.$('#submit').$('.loading')
            assert.equal(await child.waitForDisplayed(), true)
            assert.equal(await child.getText(), 'Late')
        })
        await check('action waits for an initially missing parent', async () => {
            await browser.$('#submit').click()
            await browser.execute(() => {
                setTimeout(() => {
                    document.body.innerHTML = '<div id="submit"><button class="loading" onclick="window.insideClicks=1">Late</button></div>'
                }, 100)
            })
            await browser.$('#submit').$('.loading').click()
            assert.equal(await browser.execute(() => window.insideClicks), 1)
        })
        await check('same missing child is found when its parent returns', async () => {
            await browser.$('#submit').click()
            const child = await browser.$('#submit').$('.loading')
            assert.equal(await child.waitForDisplayed({ reverse: true }), true)
            await browser.execute(() => {
                setTimeout(() => {
                    document.body.innerHTML = '<div id="submit"><span class="loading">Returned</span></div>'
                }, 100)
            })
            assert.equal(await child.waitForDisplayed(), true)
            assert.equal(await child.getText(), 'Returned')
            assert.equal(child.parent.error, undefined)
        })
        await check('deeper missing ancestors retain the child scope', async () => {
            await browser.execute(() => {
                document.body.innerHTML = '<main id="outer"><div id="submit"><span class="loading">Nested</span></div></main><span class="loading">Outside</span>'
            })
            const child = await browser.$('#outer').$('#submit').$('.loading')
            await browser.execute(() => document.querySelector('#outer').remove())
            assert.equal(await child.waitForDisplayed({ reverse: true }), true)
            assert.equal(await browser.$('#outer').$('#submit').$('.loading').waitForDisplayed({ reverse: true }), true)
        })
        await check('late parent reacquisition keeps strict matching', async () => {
            await browser.$('#submit').click()
            const child = await browser.$('#submit').$('.loading')
            await browser.execute(() => {
                document.body.innerHTML = '<div id="submit"><span class="loading">First</span></div><div id="submit"><span class="loading">Second</span></div>'
            })
            await assert.rejects(child.waitForDisplayed(), /strict mode violation/)
        })
        await check('invalid child selectors still reject', async () => {
            await assert.rejects(browser.$('#submit').$('[').waitForDisplayed({ reverse: true }), /invalid selector/)
        })
        await check('invalid parent selectors still reject', async () => {
            await assert.rejects(browser.$('[').$('.loading').waitForDisplayed({ reverse: true }), /invalid selector/)
        })
        console.log(`${transport}: ${passed} nested-wait checks passed`)
    } finally {
        await browser.deleteSession()
    }
}
