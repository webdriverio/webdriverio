import { describe, it, expect, beforeAll, beforeEach, afterEach, vi, type MockInstance } from 'vitest'
import type { Options } from '@wdio/types'

import {
    CAPS_METADATA_RUNNER_STATS,
    FULL_RUNNER_STATS,
    SMALL_RUNNER_STATS,
    WDIO6_RUNNER_STATS,
} from './__mocks__/mocks.js'
import { browser } from '@wdio/globals'
import { Metadata } from '../src/metadata.js'
import { NOT_KNOWN } from '../src/constants.js'
import type { cjson_metadata } from '../src/types'
import type { DesiredCapabilitiesExtended, W3CCapabilitiesExtended, WebdriverIOExtended } from '../src/types/wdio'

vi.mock('@wdio/globals', () => ({
    browser: {
        options: {
            requestedCapabilities: {
                w3cCaps: {
                    alwaysMatch: {
                        foo: true,
                    },
                },
            },
        } as WebdriverIOExtended,
    }
}))

describe('metadata', () => {
    let metadataClassObject: Metadata

    beforeAll(() => {
        metadataClassObject = new Metadata()
    })

    describe('determineAppData', () => {
        it('should return that no app metadata could be determined', () => {
            expect(
                metadataClassObject.determineAppData({} as WebdriverIO.Capabilities, {} as cjson_metadata),
            ).toMatchSnapshot()
        })

        it('should return that the app name and version based on the metadata', () => {
            expect(
                metadataClassObject.determineAppData(
                    {} as WebdriverIO.Capabilities,
                    {
                        app: {
                            name: 'metadata app name',
                            version: 'metadata version 1.2.3',
                        },
                    } as cjson_metadata,
                ),
            ).toMatchSnapshot()
        })

        it('should return that the app name based on the config.app', () => {
            expect(
                metadataClassObject.determineAppData(
                    {
                        app: 'here/there/app.apk',
                    } as WebdriverIO.Capabilities,
                    {} as cjson_metadata,
                ),
            ).toMatchSnapshot()
        })
    })

    describe('determineBrowserData', () => {
        it('should return that no browser metadata could be determined', () => {
            expect(
                metadataClassObject.determineBrowserData(
                    {} as WebdriverIO.Capabilities,
                    {} as cjson_metadata,
                ),
            ).toMatchSnapshot()
        })

        it('should return that the browser name and version based on the metadata', () => {
            expect(
                metadataClassObject.determineBrowserData(
                    {} as WebdriverIO.Capabilities,
                    {
                        browser: {
                            name: 'metadata browser name',
                            version: 'metadata version 1.2.3',
                        },
                    } as cjson_metadata,
                ),
            ).toMatchSnapshot()
        })

        it('should return that the browser name and version based on the capabilities when browserVersion is used', () => {
            expect(
                metadataClassObject.determineBrowserData(
                    {
                        browserName: 'capabilities browser name',
                        browserVersion: 'capabilities browserVersion',
                    } as WebdriverIO.Capabilities,
                    {} as cjson_metadata,
                ),
            ).toMatchSnapshot()
        })
    })

    describe('determineDeviceName', () => {
        it('should be able to return the device metadata based on the metadata.device', () => {
            expect(
                metadataClassObject.determineDeviceName(
                    { device: 'metadata.device' } as cjson_metadata,
                    {} as DesiredCapabilitiesExtended,
                ),
            ).toMatchSnapshot()
        })
        it('should be able to return the device metadata based on the current.config.capabilities.deviceName', () => {
            expect(
                metadataClassObject.determineDeviceName(
                    {} as cjson_metadata,
                    { 'cjson:metadata': { device: 'current.config.capabilities.deviceName' } } as DesiredCapabilitiesExtended,
                ),
            ).toMatchSnapshot()
        })

        it('should be able to return the not known deviceName', () => {
            expect(
                metadataClassObject.determineDeviceName({} as cjson_metadata, {} as DesiredCapabilitiesExtended),
            ).toMatchSnapshot()
        })
    })

    describe('determinePlatformName', () => {
        it('should be able to return the platform name based on the metadata.platform', () => {
            expect(
                metadataClassObject.determinePlatformName(
                    {
                        platform: {
                            name: 'platform.name',
                        },
                    } as cjson_metadata,
                    {} as WebdriverIO.Capabilities,
                ),
            ).toMatchSnapshot()
        })

        it('should be able to return the platform name based on the currentCapabilities.platformName', () => {
            expect(
                metadataClassObject.determinePlatformName(
                    {} as cjson_metadata,
                    { platformName: 'currentCapabilities.platformName' } as WebdriverIO.Capabilities,
                ),
            ).toMatchSnapshot()
        })

        it('should be able to return the platform name based on the currentCapabilities.platformName for mac properly', () => {
            expect(
                metadataClassObject.determinePlatformName(
                    {} as cjson_metadata,
                    { platformName: 'mac' } as WebdriverIO.Capabilities,
                ),
            ).toMatchSnapshot()
        })

        it('should be able to return the platform name based on the currentCapabilities.platformName for windows properly', () => {
            expect(
                metadataClassObject.determinePlatformName(
                    {} as cjson_metadata,
                    { platformName: 'windows nt' } as WebdriverIO.Capabilities,
                ),
            ).toMatchSnapshot()
        })

        it('should be able to return the not known platform name', () => {
            expect(
                metadataClassObject.determinePlatformName({} as cjson_metadata, {} as WebdriverIO.Capabilities),
            ).toMatchSnapshot()
        })
    })

    describe('determinePlatformVersion', () => {
        it('should be able to return the platform version based on the metadata.platform', () => {
            expect(
                metadataClassObject.determinePlatformVersion({
                    platform: {
                        version: 'platform.version',
                    },
                } as cjson_metadata),
            ).toMatchSnapshot()
        })
        it('should be able to return the platform version based on the metadata.platform from desired capabilities', () => {
            expect(
                metadataClassObject.determinePlatformVersion(
                    {
                        platform: {
                            version: undefined,
                        },
                    } as cjson_metadata,
                    { 'appium:platformVersion': '10.1' } as WebdriverIO.Capabilities,
                ),
            ).toMatchSnapshot()
        })

        it('should be able to return the not known platform version', () => {
            expect(metadataClassObject.determinePlatformVersion({} as cjson_metadata)).toMatchSnapshot()
        })
    })

    describe('determineMetadata', () => {
        let determineAppDataSpy: MockInstance
        let determineBrowserDataSpy: MockInstance
        let determineDeviceNameSpy: MockInstance
        let determinePlatformNameSpy: MockInstance
        let determinePlatformVersionSpy
        const appMockData = {
            app: {
                name: 'mock-appName',
                version: 'mock-appVersion',
            },
        }
        const browserMockData = {
            browser: {
                name: 'mock-browserName',
                version: 'mock-browserVersion',
            },
        }

        beforeEach(() => {
            determineAppDataSpy = vi.spyOn(metadataClassObject, 'determineAppData')
            determineBrowserDataSpy = vi
                .spyOn(metadataClassObject, 'determineBrowserData')
                .mockReturnValue(browserMockData)
            determineDeviceNameSpy = vi.spyOn(metadataClassObject, 'determineDeviceName').mockReturnValue(NOT_KNOWN)
            determinePlatformNameSpy = vi
                .spyOn(metadataClassObject, 'determinePlatformName')
                .mockReturnValue(NOT_KNOWN)
            determinePlatformVersionSpy = vi
                .spyOn(metadataClassObject, 'determinePlatformVersion')
                .mockReturnValue(NOT_KNOWN)
        })

        afterEach(() => {
            vi.clearAllMocks()
        })

        it('should return app metadata based on the currentCapabilities.app', () => {
            (FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended).app = 'current.config.capabilities.app'

            determineAppDataSpy = vi.spyOn(metadataClassObject, 'determineAppData').mockReturnValue(appMockData)

            expect(metadataClassObject.determineMetadata(FULL_RUNNER_STATS)).toMatchSnapshot()

            expect(determineAppDataSpy).toHaveBeenCalledTimes(1)
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1)

            delete (FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended).app
            determineAppDataSpy.mockClear()
        })

        it('should return app metadata based on the current.config.capabilities[\'cjson:metadata\'].app', () => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended)['cjson:metadata']!.app = {
                name: 'mock-appName',
                version: 'mock-appVersion',
            }

            determineAppDataSpy = vi.spyOn(metadataClassObject, 'determineAppData').mockReturnValue(appMockData)

            expect(metadataClassObject.determineMetadata(FULL_RUNNER_STATS)).toMatchSnapshot()

            expect(determineAppDataSpy).toHaveBeenCalledTimes(1)
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1)

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            delete (FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended)['cjson:metadata']!.app
            determineAppDataSpy.mockClear()
        })

        it('should return metadata based on the data.config.capabilities["cjson:metadata"]', () => {
            global.browser = {
                options: {
                    capabilities: {},
                } as Options.WebdriverIO,
            }

            determineAppDataSpy = vi
                .spyOn(metadataClassObject, 'determineBrowserData')
                .mockReturnValue(browserMockData)

            expect(metadataClassObject.determineMetadata(CAPS_METADATA_RUNNER_STATS)).toMatchSnapshot()
            determineAppDataSpy.mockClear()
        })

        it('should return metadata based on the requestedCapabilities.w3cCaps.alwaysMatch', () => {
            global.browser = {
                options: {
                    capabilities: {},
                    requestedCapabilities: {
                        w3cCaps: {
                            alwaysMatch: {
                                'cjson:metadata': {},
                            },
                        },
                    },
                } as Options.WebdriverIO,
            }

            determineAppDataSpy = vi
                .spyOn(metadataClassObject, 'determineBrowserData')
                .mockReturnValue(browserMockData)

            expect(metadataClassObject.determineMetadata(WDIO6_RUNNER_STATS)).toMatchSnapshot()
            determineAppDataSpy.mockClear()
        })

        it('should return metadata based on the browser.options.capabilities if w3cCaps is empty', () => {
            global.browser = {
                options: {
                    requestedCapabilities: {
                        w3cCaps: {},
                    },
                    capabilities: {
                        browserName: 'chrome',
                        'cjson:metadata': {},
                    },
                } as WebdriverIOExtended,
            }

            determineAppDataSpy = vi
                .spyOn(metadataClassObject, 'determineBrowserData')
                .mockReturnValue(browserMockData)

            expect(metadataClassObject.determineMetadata(WDIO6_RUNNER_STATS)).toMatchSnapshot()
            determineAppDataSpy.mockClear()
        })

        it('should return metadata based on the browser.options.capabilities', () => {
            global.browser = {
                options: {
                    capabilities: {
                        browserName: 'chrome',
                        'cjson:metadata': {},
                    },
                } as WebdriverIOExtended,
            }

            determineAppDataSpy = vi
                .spyOn(metadataClassObject, 'determineBrowserData')
                .mockReturnValue(browserMockData)

            expect(metadataClassObject.determineMetadata(WDIO6_RUNNER_STATS)).toMatchSnapshot()
            determineAppDataSpy.mockClear()
        })

        it('should call determineBrowserData when there is no way to  determine the app data', () => {
            metadataClassObject.determineMetadata(SMALL_RUNNER_STATS)

            expect(determineAppDataSpy).toHaveBeenCalledTimes(0)
            expect(determineBrowserDataSpy).toHaveBeenCalledTimes(1)
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1)
        })

        it('should be able to return browser metadata', () => {
            expect(metadataClassObject.determineMetadata(SMALL_RUNNER_STATS)).toMatchSnapshot()

            expect(determineBrowserDataSpy).toHaveBeenCalledTimes(1)
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1)
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1)
        })
    })
})

describe('metadata in a multi-remote session', () => {
    it('reads cjson:metadata from the requested capabilities of the first instance', () => {
        const runner = {
            isMultiRemote: true,
            capabilities: {
                browserA: { browserName: 'chrome', browserVersion: '154.0', platformName: 'linux' },
                browserB: { browserName: 'firefox', browserVersion: '160.0', platformName: 'linux' }
            }
        }
        const getInstance = vi.fn().mockReturnValue({ requestedCapabilities: { 'cjson:metadata': { device: 'Requested device A' } } })
        Object.assign(browser, { getInstance })
        expect(new Metadata().determineMetadata(runner as never).device).toBe('Requested device A')
        expect(getInstance).toBeCalledWith('browserA')
        delete (browser as { getInstance?: unknown }).getInstance
    })

    it('uses the capabilities and the cjson:metadata of the first instance', () => {
        const runner = {
            isMultiRemote: true,
            capabilities: {
                browserA: {
                    browserName: 'chrome',
                    browserVersion: '154.0',
                    platformName: 'mac',
                    'cjson:metadata': { device: 'Device A' }
                },
                browserB: { browserName: 'firefox', browserVersion: '160.0', platformName: 'linux' }
            }
        }
        expect(new Metadata().determineMetadata(runner as never)).toEqual({
            browser: { name: 'chrome', version: '154.0' },
            device: 'Device A',
            platform: { name: 'osx', version: `Version ${NOT_KNOWN}` }
        })
    })
})
