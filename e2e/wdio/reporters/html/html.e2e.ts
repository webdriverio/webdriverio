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
        reportEvents.logMessage({ title: await browser.getTitle() } as never)
    })
})
