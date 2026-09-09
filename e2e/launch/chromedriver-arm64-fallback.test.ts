import { execFileSync } from 'node:child_process'
import { describe, it, expect, afterAll } from 'vitest'
import { remote, type RemoteOptions } from 'webdriverio'
import type { Browser } from 'webdriverio'

// Electron 33.2.1 bundles Chromium 130, so a chromedriver pinned to it only drives a
// major-130 system Chrome. The explicit-version tests below skip when the installed
// Chrome differs (or can't be detected), so newer-Chrome CI runners don't fail spuriously.
const ELECTRON_33_CHROMIUM_MAJOR = 130

function chromeBinaryCandidates(): string[] {
    if (process.env.CHROME_BINARY) {
        return [process.env.CHROME_BINARY]
    }
    if (process.platform === 'darwin') {
        return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'google-chrome-stable', 'google-chrome']
    }
    // Windows Chrome doesn't print its version to stdout; leave empty so the guard skips.
    if (process.platform === 'win32') {
        return []
    }
    return ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium']
}

function detectSystemChromeMajor(): number | undefined {
    for (const bin of chromeBinaryCandidates()) {
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
 * Integration tests for Linux ARM64 Chromedriver download: Chrome for Testing first with the
 * Electron release as an automatic fallback, exercised with and without explicit capabilities
 * against a real browser session.
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
                    // No version pinned, so setup auto-resolves stable and maps it to an Electron release
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
                    'wdio:electronVersion': 'invalid.version.format',
                    'goog:chromeOptions': {
                        args: ['--headless']
                    }
                }
            }

            await expect(
                remote(options)
            ).rejects.toThrow()
        }, 60000)
    })
})

// NOTE: the platform-mocked source-selection logic (ARM64 prefers Chrome for Testing and
// falls back to the Electron provider; x64 always uses CfT) is covered without real network
// access in packages/wdio-utils/tests/node/setupChromedriver.test.ts. Those assertions live
// there rather than in this e2e file, which is reserved for real browser sessions on actual
// ARM64 hardware.
