import path from 'node:path'
import url from 'node:url'
import { browser, $, expect } from '@wdio/globals'
import { ReportEvents } from '@wdio/html-reporter'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const reportEvents = new ReportEvents()

describe('html reporter', () => {
    it('logs a message and a screenshot', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')
        await expect($('h1.findme')).toBeDisplayed()
        reportEvents.logMessage('Opened the guinea pig page')
        const file = path.join(__dirname, 'results', 'html', 'screenshots', 'guinea-pig.png')
        await browser.saveScreenshot(file)
        reportEvents.logScreenshot(file)
    })

    it('logs an object', async () => {
        reportEvents.logMessage({ title: await browser.getTitle() })
    })
})

describe('html reporter hooks', () => {
    // the log of a before all hook goes to the first test of its suite, not to the test before
    before(() => {
        reportEvents.logMessage('Before all of the hooks suite')
    })

    it('runs after a before all hook', async () => {
        reportEvents.logMessage('First test of the hooks suite')
    })
})

describe('html reporter skipped suite', () => {
    // `this.skip()` in a before all hook whose only test is in a nested suite: the log goes to that skipped test
    before(function () {
        reportEvents.logMessage('Before all of the skipped suite')
        this.skip()
    })

    describe('nested', () => {
        it('is skipped by the before all hook of its parent', () => {
            reportEvents.logMessage('Never logged')
        })
    })
})
