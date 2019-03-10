import Launcher from '../src/launcher'

describe('Firefox profile service', () => {
    describe('onPrepare', () => {
        test('should return when no firefoxProfile set in the config', async () => {
            const config = {}
            const capabilities = [{}]

            const service = new Launcher()
            service.onPrepare(config, capabilities)

            expect(capabilities).toEqual([{}])
        })

        test('should set preferences with no extensions - modern', async () => {
            const config = {
                firefoxProfile : {
                    'browser.startup.homepage': 'https://webdriver.io',
                }
            }
            const capabilities = [{
                browserName : 'firefox',
            }]

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(service.profile.setPreference).toHaveBeenCalledTimes(1)
            expect(service.profile.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service.profile.updatePreferences).toHaveBeenCalled()
            expect(service.profile.addExtensions).not.toHaveBeenCalled()

            expect(capabilities[0].firefox_profile).toBe(undefined)
            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ profile : 'foobar' })
        })

        test('should set preferences with no extensions - legacy', async () => {
            const config = {
                firefoxProfile : {
                    'browser.startup.homepage': 'https://webdriver.io',
                    legacy: true
                }
            }
            const capabilities = [{
                browserName : 'firefox',
            }]

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(service.profile.setPreference).toHaveBeenCalledTimes(1)
            expect(service.profile.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service.profile.updatePreferences).toHaveBeenCalled()
            expect(service.profile.addExtensions).not.toHaveBeenCalled()

            expect(capabilities[0].firefox_profile).toBe('foobar')
            expect(capabilities[0]['moz:firefoxOptions']).toEqual(undefined)
        })

        test('should amend firefox capabilities', async () => {
            const config = {
                firefoxProfile : {
                    'browser.startup.homepage': 'https://webdriver.io',
                }
            }
            const capabilities = [{
                browserName : 'firefox',
                'moz:firefoxOptions': {
                    args: ['-headless']
                }
            }]

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(service.profile.setPreference).toHaveBeenCalledTimes(1)
            expect(service.profile.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service.profile.updatePreferences).toHaveBeenCalled()
            expect(service.profile.addExtensions).not.toHaveBeenCalled()

            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ args: ['-headless'], profile : 'foobar' })
        })

        test('should set preferences with extensions', async () => {
            const config = {
                firefoxProfile : {
                    extensions : ['/foo/bar.xpi'],
                }
            }
            const capabilities = [{
                browserName : 'firefox',
            }]

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ profile : 'foobar' })

            expect(service.profile.addExtensions.mock.calls[0][0]).toBe(config.firefoxProfile.extensions)
        })

        test('should not set capabilities when not firefox browser', async () => {
            const config = {
                firefoxProfile : {
                    'browser.startup.homepage': 'https://webdriver.io',
                }
            }
            const capabilities = [
                {
                    browserName : 'firefox',
                },
                {
                    browserName : 'chrome'
                }
            ]

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(capabilities[0]['moz:firefoxOptions']).toEqual({ profile : 'foobar' })

            expect(capabilities[1]).not.toHaveProperty('firefox_profile')
            expect(capabilities[1]).not.toHaveProperty('moz:firefoxOptions')
        })

        test('should set capabilities when an object', async () => {
            const config = {
                firefoxProfile : {
                    'browser.startup.homepage': 'https://webdriver.io',
                }
            }
            const capabilities = {
                firefox : {
                    capabilities : {
                        browserName : 'firefox',
                    }
                }
            }

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(capabilities.firefox.capabilities['moz:firefoxOptions']).toEqual({ profile : 'foobar' })
        })

        test('should not set capabilities when an object and not firefox', async () => {
            const config = {
                firefoxProfile : {
                    'browser.startup.homepage': 'https://webdriver.io',
                }
            }
            const capabilities = {
                foo : {
                    capabilities : {
                        browserName : 'chrome',
                    }
                }
            }

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(capabilities.foo.capabilities).not.toHaveProperty('firefox_profile')
            expect(capabilities.foo.capabilities).not.toHaveProperty('moz:firefoxOptions')
        })

        test('should set proxy', async () => {
            const config = {
                firefoxProfile : {
                    extensions : ['/foo/bar.xpi'],
                    'browser.startup.homepage': 'https://webdriver.io',
                    proxy : 'foo'
                }
            }
            const capabilities = [{
                browserName : 'firefox',
            }]

            const service = new Launcher()
            await service.onPrepare(config, capabilities)

            expect(service.profile.setProxy).toHaveBeenCalledTimes(1)
            expect(service.profile.setProxy).toHaveBeenCalledWith(config.firefoxProfile.proxy)

            expect(service.profile.setPreference).toHaveBeenCalledTimes(1)
            expect(service.profile.setPreference).toHaveBeenCalledWith('browser.startup.homepage', 'https://webdriver.io')
            expect(service.profile.updatePreferences).toHaveBeenCalled()
        })
    })
})
