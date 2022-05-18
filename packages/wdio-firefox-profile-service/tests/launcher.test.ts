import Launcher from '../src/launcher'
import FirefoxProfile from 'firefox-profile'
import type WebdriverIO from 'webdriverio'

import { describe, expect, test, vi } from 'vitest'

vi.mock('firefox-profile')

describe('Firefox profile service', () => {
    describe('onPrepare', () => {
        test('should return when no firefoxProfile set in the config', async () => {
            const options = {}
            const capabilities = [{}]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(capabilities).toEqual([{}])
        })

        test('should set preferences with no extensions - modern', async () => {
            const options = {
                'browser.startup.homepage': 'https://webdriver.io',
            }
            const capabilities: WebDriver.DesiredCapabilities[] = [{
                browserName : 'firefox',
            }]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(service['_profile']!.setPreference).toHaveBeenCalledTimes(1)
            expect(service['_profile']!.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service['_profile']!.updatePreferences).toHaveBeenCalled()
            expect(service['_profile']!.addExtensions).not.toHaveBeenCalled()

            expect(capabilities[0].firefox_profile).toBe(undefined)
            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ profile : 'foobar' })
        })

        test('should set preferences with no extensions - legacy', async () => {
            const options = {
                'browser.startup.homepage': 'https://webdriver.io',
                legacy: true
            }
            const capabilities: WebDriver.DesiredCapabilities[] = [{
                browserName : 'firefox',
            }]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(service['_profile']!.setPreference).toHaveBeenCalledTimes(1)
            expect(service['_profile']!.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service['_profile']!.updatePreferences).toHaveBeenCalled()
            expect(service['_profile']!.addExtensions).not.toHaveBeenCalled()

            expect(capabilities[0].firefox_profile).toBe('foobar')
            expect(capabilities[0]['moz:firefoxOptions']).toEqual(undefined)
        })

        test('should amend firefox capabilities', async () => {
            const options = {
                'browser.startup.homepage': 'https://webdriver.io',
            }
            const capabilities: WebDriver.DesiredCapabilities[] = [{
                browserName : 'firefox',
                'moz:firefoxOptions': {
                    args: ['-headless']
                }
            }]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(service['_profile']!.setPreference).toHaveBeenCalledTimes(1)
            expect(service['_profile']!.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service['_profile']!.updatePreferences).toHaveBeenCalled()
            expect(service['_profile']!.addExtensions).not.toHaveBeenCalled()

            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ args: ['-headless'], profile : 'foobar' })
        })

        test('should set preferences with extensions', async () => {
            const options = { extensions : ['/foo/bar.xpi'] }
            const capabilities: WebDriver.DesiredCapabilities[] = [{ browserName : 'firefox' }]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ profile : 'foobar' })
            expect(vi.mocked(service['_profile']!.addExtensions).mock.calls[0][0]).toBe(options.extensions)
        })

        test('should not set capabilities when not firefox browser', async () => {
            const options = {
                'browser.startup.homepage': 'https://webdriver.io',
            }
            const capabilities: WebDriver.DesiredCapabilities[] = [{
                browserName : 'firefox',
            }, {
                browserName : 'chrome'
            }]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ profile : 'foobar' })
            expect(capabilities[1]).not.toHaveProperty('firefox_profile')
            expect(capabilities[1]).not.toHaveProperty('moz:firefoxOptions')
        })

        test('should set capabilities when in multiremote', async () => {
            const options = {
                'browser.startup.homepage': 'https://webdriver.io',
            }
            // @ts-expect-error
            const capabilities: WebdriverIO.MultiRemoteCapabilities = {
                firefox : {
                    capabilities : {
                        browserName : 'firefox',
                    }
                }
            }

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(capabilities.firefox.capabilities['moz:firefoxOptions']).toEqual({ profile : 'foobar' })
        })

        test('should not set capabilities when an object and not firefox', async () => {
            const options = {
                'browser.startup.homepage': 'https://webdriver.io',
            }
            // @ts-expect-error
            const capabilities: WebdriverIO.MultiRemoteCapabilities = {
                foo : {
                    capabilities: {
                        browserName : 'chrome',
                    }
                }
            }

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(capabilities.foo.capabilities).not.toHaveProperty('firefox_profile')
            expect(capabilities.foo.capabilities).not.toHaveProperty('moz:firefoxOptions')
        })

        test('should set proxy', async () => {
            const options = {
                extensions : ['/foo/bar.xpi'],
                'browser.startup.homepage': 'https://webdriver.io',
                proxy : { proxyType: 'direct' as const }
            }
            const capabilities: WebDriver.DesiredCapabilities[] = [{
                browserName : 'firefox',
            }]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(service['_profile']!.setProxy).toHaveBeenCalledTimes(1)
            expect(service['_profile']!.setProxy).toHaveBeenCalledWith(options.proxy)

            expect(service['_profile']!.setPreference).toHaveBeenCalledTimes(1)
            expect(service['_profile']!.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service['_profile']!.updatePreferences).toHaveBeenCalled()
        })

        test('should load from directory if profileDirectory is set', async () => {
            const options = {
                profileDirectory: '/tmp/firefox-profile'
            }
            const capabilities: WebDriver.DesiredCapabilities[] = [{
                browserName : 'firefox',
            }]

            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)

            expect(FirefoxProfile.copy).toHaveBeenCalledWith(options.profileDirectory, expect.any(Function))
        })

        test('should not continue if profile could not be created', async () => {
            const options = {
                profileDirectory: '/tmp/firefox-profile'
            }
            const capabilities: WebDriver.DesiredCapabilities[] = [{
                browserName : 'firefox',
            }]

            vi.mocked(FirefoxProfile.copy).mockImplementationOnce((profileDirectory: string, cb: Function) => cb())
            const service = new Launcher(options)
            await service.onPrepare({} as never, capabilities)
            // no assertion needed as we return early and no failure due to
            // undefined profile is checked
        })
    })

    test('should return when no firefoxProfile set in the config', async () => {
        const service = new Launcher({})
        service['_setPreferences']()
        service['_buildExtension']([])
    })
})
