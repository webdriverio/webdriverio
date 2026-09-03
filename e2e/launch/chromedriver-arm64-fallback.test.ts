import { execFileSync } from 'node:child_process'
import { describe, it, expect, afterAll } from 'vitest'
import { remote, type RemoteOptions } from 'webdriverio'
import type { Browser } from 'webdriverio'

// Electron 33.2.1 bundles Chromium 130, so a chromedriver pinned to it only drives a
// major-130 system Chrome. The explicit-version tests below skip when the installed
// Chrome differs (or can't be detected), so newer-Chrome CI runners don't fail spuriously.
const ELECTRON_33_CHROMIUM_MAJOR = 130

function detectSystemChromeMajor(): number | undefined {
    const candidates = process.env.CHROME_BINARY
        ? [process.env.CHROME_BINARY]
        : process.platform === 'darwin'
            ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'google-chrome-stable', 'google-chrome']
            : process.platform === 'win32'
                // Windows Chrome doesn't print its version to stdout; leave empty so the guard skips.
                ? []
                : ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium']

    for (const bin of candidates) {
        try {
            const out = execFileSync(bin, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
            const major = /\b(\d+)\.\d+\.\d+/.exec(out)?.[1]
            if (major) {
                return Number(major)
            }
        } catch {
            // try the next candidate
        }
    }
    return undefined
}

/**
 * Integration tests for Linux ARM64 Chromedriver download
 *
 * These tests verify that:
 * 1. Chromedriver downloads successfully on Linux ARM64 (Chrome for Testing first, with the
 *    Electron release as an automatic fallback)
 * 2. The downloaded chromedriver works correctly
 * 3. Version resolution works with and without explicit capabilities
 */
describe('Chromedriver Linux ARM64 download', () => {
    let browser: Browser

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession().catch(() => {})
        }
    })

    describe('automatic source selection (no explicit capabilities)', () => {
        it('should download a working chromedriver on ARM64', async () => {
            if (process.platform !== 'linux' || process.arch !== 'arm64') {
                console.log('Skipping ARM64-specific test (not on Linux ARM64)')
                return
            }

            const options: RemoteOptions = {
                logLevel: 'info',
                capabilities: {
                    browserName: 'chrome',
                    'goog:chromeOptions': {
                        args: [
                            '--headless',
                            '--no-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu'
                        ]
                    }
                }
            }

            // Chrome for Testing serves linux-arm64; the Electron release is the automatic fallback
            browser = await remote(options)

            expect(browser.sessionId).toBeDefined()
            expect(browser.sessionId).toMatch(/^[a-f0-9-]+$/)

            await browser.url('https://guinea-pig.webdriver.io/')
            const title = await browser.getTitle()
            expect(title).toBe('WebdriverIO · Next-gen browser automation test framework for Node.js')

            const userAgent = await browser.execute(() => navigator.userAgent)
            expect(userAgent).toContain('Chrome')
            expect(userAgent).toBeDefined()
        }, 180000) // 3 minute timeout for download + browser startup
    })

    describe('explicit Electron version capability', () => {
        it('should use specified Electron version', async () => {
            const chromeMajor = detectSystemChromeMajor()
            if (chromeMajor !== ELECTRON_33_CHROMIUM_MAJOR) {
                console.log(`Skipping explicit-Electron-version test (system Chrome major ${chromeMajor ?? 'unknown'} != ${ELECTRON_33_CHROMIUM_MAJOR})`)
                return
            }

            const options: RemoteOptions = {
                logLevel: 'info',
                capabilities: {
                    browserName: 'chrome',
                    'wdio:electronVersion': '33.2.1',
                    'goog:chromeOptions': {
                        args: [
                            '--headless',
                            '--no-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu'
                        ]
                    }
                }
            }

            browser = await remote(options)

            expect(browser.sessionId).toBeDefined()

            await browser.url('https://guinea-pig.webdriver.io/')
            const title = await browser.getTitle()
            expect(title).toBeTruthy()
        }, 180000)
    })

    describe('explicit Chromium version capability', () => {
        it('should map Chromium version to Electron release', async () => {
            const chromeMajor = detectSystemChromeMajor()
            if (chromeMajor !== ELECTRON_33_CHROMIUM_MAJOR) {
                console.log(`Skipping explicit-Chromium-version test (system Chrome major ${chromeMajor ?? 'unknown'} != ${ELECTRON_33_CHROMIUM_MAJOR})`)
                return
            }

            const options: RemoteOptions = {
                logLevel: 'info',
                capabilities: {
                    browserName: 'chrome',
                    'wdio:chromiumVersion': '130.0.6723.2',
                    'goog:chromeOptions': {
                        args: [
                            '--headless',
                            '--no-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu'
                        ]
                    }
                }
            }

            browser = await remote(options)

            expect(browser.sessionId).toBeDefined()

            await browser.url('data:text/html,<h1>Test</h1>')
            const h1Text = await browser.$('h1').getText()
            expect(h1Text).toBe('Test')
        }, 180000)
    })

    describe('version resolution', () => {
        it('should work without specifying browser version', async () => {
            if (process.platform !== 'linux' || process.arch !== 'arm64') {
                console.log('Skipping ARM64-specific test (not on Linux ARM64)')
                return
            }

            const options: RemoteOptions = {
                logLevel: 'info',
                capabilities: {
                    browserName: 'chrome',
                    // No browserVersion, no Electron version
                    // Should auto-resolve to stable and map to Electron
                    'goog:chromeOptions': {
                        args: ['--headless', '--no-sandbox', '--disable-gpu']
                    }
                }
            }

            browser = await remote(options)

            expect(browser.sessionId).toBeDefined()

            await browser.url('data:text/html,<p id="test">Hello World</p>')
            const text = await browser.$('#test').getText()
            expect(text).toBe('Hello World')
        }, 180000)
    })

    describe('error handling', () => {
        it('should provide clear error if Electron version cannot be resolved', async () => {
            const options: RemoteOptions = {
                logLevel: 'error',
                capabilities: {
                    browserName: 'chrome',
                    'wdio:chromiumVersion': 'invalid.version.format',
                    'goog:chromeOptions': {
                        args: ['--headless']
                    }
                }
            }

            // Should fail with a clear error message
            await expect(
                remote(options)
            ).rejects.toThrow()
        }, 60000)
    })
})

// NOTE: platform-mocked source-selection logic (ARM64 prefers Chrome for Testing and
// falls back to the Electron provider, x64 always uses CfT) is covered without real
// network access by the unit suite — see
// packages/wdio-utils/tests/node/setupChromedriver.test.ts ("should use Chrome for
// Testing first on Linux ARM64…", "should fall back to the Electron release when Chrome
// for Testing fails on Linux ARM64" and "should NOT use fallback on Linux x64"). Those
// assertions intentionally live there rather than in this e2e file, which is reserved
// for real browser sessions on actual ARM64 hardware.
