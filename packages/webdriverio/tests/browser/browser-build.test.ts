import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const browserBuildPath = path.resolve(__dirname, '../../build/browser.min.js')

function resolveChromeExecutable(): string | undefined {
    const envCandidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROME_BIN,
        process.env.CHROMIUM_BIN,
        process.env.GOOGLE_CHROME_BIN
    ].filter(Boolean) as string[]

    const platformCandidates = process.platform === 'win32' ? [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ] : process.platform === 'darwin' ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ] : [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/microsoft-edge',
        '/snap/bin/chromium'
    ]

    for (const candidate of [...envCandidates, ...platformCandidates]) {
        if (fs.existsSync(candidate)) {
            return candidate
        }
    }
    return undefined
}

const executablePath = resolveChromeExecutable()
const shouldRun =
    Boolean(process.env.WDIO_BROWSER_TESTS) &&
    Boolean(executablePath) &&
    fs.existsSync(browserBuildPath)

const describeIf = describe.runIf(shouldRun)

describeIf('Browser build (headless)', () => {
    let browser: puppeteer.Browser
    let page: puppeteer.Page
    const errors: string[] = []

    beforeAll(async () => {
        browser = await puppeteer.launch({
            executablePath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        page = await browser.newPage()
        page.on('pageerror', err => errors.push(err.message))
        await page.goto('about:blank')
        await page.addScriptTag({ path: browserBuildPath })
        await new Promise((resolve) => setTimeout(resolve, 250))
    })

    afterAll(async () => {
        await browser.close()
    })

    it('loads the browser test page without errors', async () => {
        expect(errors).toHaveLength(0)
    })

    it('exposes the remote API', async () => {
        const hasRemote = await page.evaluate(() => {
            return typeof (window as any).WebdriverIO?.remote === 'function'
        })

        expect(hasRemote).toBe(true)
    })

    it('provides basic global polyfills', async () => {
        const polyfills = await page.evaluate(() => ({
            buffer: typeof (window as any).Buffer === 'function' && typeof (window as any).Buffer.byteLength === 'function',
            process: typeof (window as any).process === 'object' && typeof (window as any).process.env === 'object'
        }))

        expect(polyfills.buffer).toBe(true)
        expect(polyfills.process).toBe(true)
    })
})
