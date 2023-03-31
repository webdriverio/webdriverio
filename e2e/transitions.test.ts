import { beforeAll, afterAll, test, expect } from 'vitest'
import DevTools from '../packages/devtools/build/index.js'
import { ELEMENT_KEY } from '../packages/devtools/build/constants.js'
import type { Client } from '../packages/devtools/build/index.js'

let browser: Client

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'chrome',
            'wdio:devtoolsOptions': {
                headless: true
            }
        }
    })
})

test('can handle navigation through clicks', async () => {
    await browser.navigateTo('http://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')

    const link = await browser.findElement('link text', 'two')
    await browser.elementClick(link[ELEMENT_KEY])
    expect(await browser.getTitle()).toBe('two')

    await browser.back()
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')

    const githubLink = await browser.findElement('link text', 'GitHub Repo')
    await browser.elementClick(githubLink[ELEMENT_KEY])
    expect(await browser.getTitle()).toContain('GitHub')
})

test('can handle navigation via JS', async () => {
    await browser.navigateTo('http://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')

    await browser.executeScript('window.location.href = "https://github.com"', [])
    expect(await browser.getTitle()).toContain('GitHub')
})

test('can handle random page transitions', async () => {
    await browser.navigateTo('http://guinea-pig.webdriver.io')
    await browser.executeScript('return (() => setTimeout(() => { window.location.href = "https://github.com" }, 200))()', [])

    const start = Date.now()
    while (Date.now() - start < 1000) {
        const title = await browser.getTitle()
        expect(typeof title).toBe('string')

        /**
         * stop loop if new page was reached
         */
        if (title.includes('GitHub')) {
            break
        }
    }
})

afterAll(async () => {
    await browser.deleteSession()
})
