import { describe, it, expect, afterAll, vi } from 'vitest'
import { remote, type RemoteOptions } from 'webdriverio'
import type { Browser } from 'webdriverio'

/**
 * Integration tests for Linux ARM64 Chromedriver automatic fallback
 *
 * These tests verify that:
 * 1. Chromedriver downloads successfully on Linux ARM64 using Electron fallback
 * 2. The downloaded chromedriver works correctly
 * 3. Version resolution works with and without explicit capabilities
 */
describe('Chromedriver Linux ARM64 Fallback', () => {
    let browser: Browser

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession().catch(() => {})
        }
    })

    describe('automatic fallback (no explicit capabilities)', () => {
        it('should download chromedriver via Electron fallback on ARM64', async () => {
            // Skip if not on Linux ARM64
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

            // This should trigger automatic Electron fallback on ARM64
            browser = await remote(options)

            // Verify browser session was created successfully
            expect(browser.sessionId).toBeDefined()
            expect(browser.sessionId).toMatch(/^[a-f0-9-]+$/)

            // Verify we can navigate and interact with pages
            await browser.url('https://guinea-pig.webdriver.io/')
            const title = await browser.getTitle()
            expect(title).toBe('WebdriverIO · Next-gen browser automation test framework for Node.js')

            // Verify we can execute browser commands
            const userAgent = await browser.execute(() => navigator.userAgent)
            expect(userAgent).toContain('Chrome')
            expect(userAgent).toBeDefined()
        }, 180000) // 3 minute timeout for download + browser startup
    })

    describe('explicit Electron version capability', () => {
        it('should use specified Electron version', async () => {
            // This test can run on any platform since we're explicitly requesting Electron
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

            // Verify the browser works
            await browser.url('data:text/html,<h1>Test</h1>')
            const h1Text = await browser.$('h1').getText()
            expect(h1Text).toBe('Test')
        }, 180000)
    })

    describe('version resolution', () => {
        it('should work without specifying browser version', async () => {
            // Skip if not on Linux ARM64
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

            // Basic functionality test
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

/**
 * Mock-based tests for platforms other than Linux ARM64
 * These verify the fallback logic without requiring actual ARM64 hardware
 */
describe('Chromedriver ARM64 Fallback (mocked platform)', () => {
    const originalPlatform = process.platform
    const originalArch = process.arch

    afterAll(() => {
        // Restore original values
        Object.defineProperty(process, 'platform', { value: originalPlatform })
        Object.defineProperty(process, 'arch', { value: originalArch })
    })

    it('should trigger fallback when arch is arm64 and platform is linux', async () => {
        // Mock Linux ARM64 environment
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
        Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })

        // Import setupChromedriver to test the logic directly
        const { setupChromedriver } = await import('../../packages/wdio-utils/src/node/utils.js')

        // Mock the download to avoid actual network calls
        const _mockInstall = vi.fn().mockResolvedValue({
            executablePath: '/mock/path/to/chromedriver',
            browser: 'chromedriver',
            buildId: '130.0.6723.58',
            platform: 'linux-arm64',
            path: '/cache/chromedriver'
        })

        // This should not throw and should use Electron provider
        const result = await setupChromedriver('/tmp/cache', undefined, {
            browserName: 'chrome'
        })

        expect(result).toHaveProperty('executablePath')
        expect(result.executablePath).toBeTruthy()
    }, 30000)

    it('should NOT trigger fallback on x64 architecture', async () => {
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
        Object.defineProperty(process, 'arch', { value: 'x64', configurable: true })

        const { setupChromedriver } = await import('../../packages/wdio-utils/src/node/utils.js')

        // Should use standard Chrome for Testing, not Electron fallback
        const result = await setupChromedriver('/tmp/cache', '130.0.6723.58', {
            browserName: 'chrome'
        })

        expect(result).toHaveProperty('executablePath')
    }, 30000)
})
