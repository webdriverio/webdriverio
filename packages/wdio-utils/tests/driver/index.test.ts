import fsp from 'node:fs/promises'
import cp from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import * as path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { start as startSafaridriver } from 'safaridriver'
import { start as startGeckodriver } from 'geckodriver'
import { start as startEdgedriver } from 'edgedriver'
import { install } from '@puppeteer/browsers'

import * as drivers from '../../src/driver/index.js'

const startWebDriver = drivers.startWebDriver

vi.mock('node:path', async (orig) => {

    const origPath: typeof import('node:path') = await orig()

    type PathEntries = [keyof typeof origPath, typeof origPath[keyof typeof origPath]]

    const pathSUT = Object.fromEntries(
        Object
            .entries(origPath)
            .map(([name, prop]: PathEntries) => {
                return [name, vi.fn().mockImplementation((...args: any[]) => {
                    const sutPath = origPath[process.platform as 'win32'] ?? origPath.posix
                    return typeof prop === 'function'
                        ? (sutPath[name] as Function)(...args)
                        : sutPath[name]
                })]
            })
    )

    const mod = { ...origPath, ...pathSUT }

    return { ...mod, default: { ...mod } }
})

vi.mock('../../src/driver/utils', async () => {
    const origUtils = await vi.importActual('../../src/driver/utils.js') as any

    const mod = {
        installDMG: vi.fn().mockResolvedValue(void 0),
        extractTar: vi.fn().mockResolvedValue(void 0),
        downloadFile: vi.fn().mockResolvedValue(void 0),
        unpackArchive: vi.fn().mockImplementation((archivePath: string, folderPath: string) => {
            fs.mkdirSync(folderPath, { recursive: true })
        }),
    }

    return {
        __esModule: true,
        ...origUtils,
        ...mod,
        default: {
            ...origUtils,
            ...mod
        }
    }
})

vi.mock('../../src/driver/firefox', async (orig) => {
    const origFF: typeof import('../../src/driver/firefox.js') = await orig()
    const mod = {
        ...origFF,
        getLatestVersionsFF: vi.fn().mockResolvedValue({
            'FIREFOX_AURORA': '',
            'FIREFOX_DEVEDITION': '117.0b9',
            'FIREFOX_ESR': '102.14.0esr',
            'FIREFOX_ESR_NEXT': '115.1.0esr',
            'FIREFOX_NIGHTLY': '118.0a1',
            'LATEST_FIREFOX_DEVEL_VERSION': '117.0b9',
            'LATEST_FIREFOX_OLDER_VERSION': '3.6.28',
            'LATEST_FIREFOX_RELEASED_DEVEL_VERSION': '117.0b9',
            'LATEST_FIREFOX_VERSION': '116.0.3',
        }),

        getFirefoxInfo: vi.fn().mockResolvedValue(
            Object.fromEntries(
                [
                    'firefox-102.14.0esr',
                    'firefox-114.0b9',
                    'firefox-115.1.0esr',
                    'firefox-114.0.1',
                    'firefox-116.0.3'
                ].map(version => [version, {}])
            )),
    }

    return {
        __esModule: true,
        ...origFF,
        ...mod,
        default: {
            ...origFF,
            ...mod,
        }
    }
})

vi.mock('node:fs/promises', async (orig) => {
    const origFS: typeof import('node:fs/promises') = await orig()
    const mod = {
        ...origFS,
        access: vi.fn().mockRejectedValue(new Error('boom')),
        mkdir: vi.fn(),
    }
    return { ...mod, default: { ...mod } }
})

vi.mock('node:fs', async (orig) => {
    const origFS: typeof import('node:fs') = await orig()
    const mod = {
        ...origFS,
        createWriteStream: vi.fn()
    }
    return { ...mod, default: { ...mod, } }
})

vi.mock('node:child_process', async (orig) => {
    const origFS: typeof import('node:child_process') = await orig()
    const mod = {
        ...origFS,
        spawn: vi.fn().mockReturnValue({
            stdout: { pipe: vi.fn() },
            stderr: { pipe: vi.fn() }
        }),
        execSync: vi.fn().mockReturnValue(Buffer.from('115.0.5790.171'))
    }
    return { ...mod, default: { ...mod, } }
})

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('devtools', () => ({ default: 'devtools package' }))
vi.mock('webdriver', () => ({ default: 'webdriver package' }))
vi.mock('safaridriver', () => ({ start: vi.fn().mockReturnValue('safaridriver') }))
vi.mock('edgedriver', () => ({
    start: vi.fn().mockResolvedValue('edgedriver'),
    findEdgePath: vi.fn().mockReturnValue('/foo/bar/executable')
}))
vi.mock('geckodriver', () => ({ start: vi.fn().mockResolvedValue('geckodriver') }))
vi.mock('wait-port', () => ({ default: vi.fn() }))
vi.mock('get-port', () => ({ default: vi.fn().mockResolvedValue(1234) }))

vi.mock('@puppeteer/browsers', async (orig) => {
    const origPB: typeof import('@puppeteer/browsers') = await orig()
    const mod = {
        ...origPB,
        ChromeReleaseChannel: { STABLE: 'stable' },
        detectBrowserPlatform: vi.fn().mockReturnValue('mac_arm'),
        resolveBuildId: vi.fn().mockReturnValue('115.0.5790.171'),
        canDownload: vi.fn().mockResolvedValue(true),
        computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
        getInstalledBrowsers: vi.fn().mockResolvedValue([]),
        install: vi.fn().mockResolvedValue({}),
    }
    return { ...mod, default: { ...mod, } }
})

vi.mock('node:os', async (orig) => {
    const origOS: typeof import('node:os') = await orig()
    const mod = {
        ...origOS,
        arch: vi.fn(),
        platform: vi.fn(),
    }
    return { ...mod, default: { ...mod } }
})

type PossibleArch = 'arm64' | 'arm64' | 'ia32' | 'x64'
type PossibleOS = 'win32' | 'darwin' | 'linux'

const systemsUnderTest: { OS: PossibleOS, ARCH: PossibleArch }[] = process.env.CI
    ? [{
        OS: process.platform as PossibleOS,
        ARCH: process.arch as PossibleArch
    }]
    : [
        { OS: 'win32', ARCH: 'x64' },
        { OS: 'win32', ARCH: 'arm64' },
        { OS: 'win32', ARCH: 'ia32' },
        { OS: 'darwin', ARCH: 'x64' },
        { OS: 'darwin', ARCH: 'arm64' },
        { OS: 'linux', ARCH: 'x64' },
    ]

systemsUnderTest.forEach(({ OS, ARCH }) =>

    describe(`startWebDriver on ${OS} ${ARCH}`, () => {

        const WDIO_SKIP_DRIVER_SETUP = process.env.WDIO_SKIP_DRIVER_SETUP

        beforeEach(() => {
            delete process.env.WDIO_SKIP_DRIVER_SETUP
            vi.mocked(install).mockClear()
            vi.mocked(fsp.access).mockClear()
            vi.mocked(fsp.mkdir).mockClear()
            vi.mocked(fs.createWriteStream).mockClear()
            vi.mocked(cp.spawn).mockClear()

            vi.mocked(startEdgedriver).mockClear()
            vi.mocked(startGeckodriver).mockClear()
            vi.mocked(startSafaridriver).mockClear()

            // Mock system config
            vi.stubGlobal('process', {
                ...process,
                arch: ARCH,
                platform: OS
            })
            vi.spyOn(os, 'platform').mockImplementation(() => OS)
            vi.spyOn(os, 'arch').mockImplementation(() => ARCH)
        }),

        afterEach(() => {

            vi.unstubAllGlobals()

            process.env.WDIO_SKIP_DRIVER_SETUP = WDIO_SKIP_DRIVER_SETUP
        })

        it('should start safari driver', async () => {
            const params = {
                capabilities: {
                    browserName: 'safari',
                    'wdio:safaridriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('safaridriver')
            await expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'safari',
                    'wdio:safaridriverOptions': {
                        foo: 'bar'
                    },
                },
                headers: {
                    Host: 'localhost',
                },
            })
            expect(startSafaridriver).toBeCalledTimes(1)
            expect(startSafaridriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                useTechnologyPreview: false
            })
        })

        it('should start firefox driver', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')
            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': {
                        'binary': undefined,
                    }
                }
            })
            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with latest nightly', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: 'nightly',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '118.0',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]118[.]0a1[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]118[.]0a1[/]firefox$/,
                            win32: /^.*[-]118[.]0a1[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with latest esr', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: 'esr',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '102.14',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]102[.]14[.]0esr[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]102[.]14[.]0esr[/]firefox$/,
                            win32: /^.*[-]102[.]14[.]0esr[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with latest dev', async () => {

            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: 'dev',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '117.0',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]117[.]0b9dev[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]117[.]0b9dev[/]firefox$/,
                            win32: /^.*[-]117[.]0b9dev[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with latest beta', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: 'beta',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '117.0',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]117[.]0b9[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]117[.]0b9[/]firefox$/,
                            win32: /^.*[-]117[.]0b9[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with latest stable', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: 'stable',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '116.0.3',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]116[.]0[.]3[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]116[.]0[.]3[/]firefox$/,
                            win32: /^.*[-]116[.]0[.]3[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with specific nightly', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '118.0a1',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '118.0',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]118[.]0a1[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]118[.]0a1[/]firefox$/,
                            win32: /^.*[-]118[.]0a1[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with specific esr', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '115.1.0esr',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '115.1',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]115[.]1[.]0esr[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]115[.]1[.]0esr[/]firefox$/,
                            win32: /^.*[-]115[.]1[.]0esr[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with specific dev', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '117.0b2dev',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '117.0',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]117[.]0b2dev[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]117[.]0b2dev[/]firefox$/,
                            win32: /^.*[-]117[.]0b2dev[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with specific beta', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '117.0b2',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '117.0',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]117[.]0b2[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]117[.]0b2[/]firefox$/,
                            win32: /^.*[-]117[.]0b2[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start firefox driver with specific stable', async () => {
            const params = {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '114.0.1',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(params)).resolves.toBe('geckodriver')

            expect(params).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'firefox',
                    'browserVersion': '114.0.1',
                    'wdio:geckodriverOptions': {
                        foo: 'bar'
                    },
                    'moz:firefoxOptions': expect.objectContaining({
                        binary: expect.stringMatching({
                            darwin: /^.*[-]114[.]0[.]1[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                            linux: /^.*[-]114[.]0[.]1[/]firefox$/,
                            win32: /^.*[-]114[.]0[.]1[\\]firefox[.]exe$/
                        }[OS])
                    })
                }
            })

            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({
                port: 1234,
                foo: 'bar',
                cacheDir: expect.any(String)
            })
        })

        it('should start edge driver', async () => {

            const options = {
                capabilities: {
                    browserName: 'edge',
                    'wdio:edgedriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(options)).resolves.toBe('edgedriver')
            expect(options).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'MicrosoftEdge',
                    'wdio:edgedriverOptions': {
                        foo: 'bar'
                    },
                    ...({
                        linux: {
                            'ms:edgeOptions': {
                                binary: '/foo/bar/executable'
                            }
                        }
                    }[OS as string] ?? {})
                }
            })
            expect(startEdgedriver).toBeCalledTimes(1)
            expect(startEdgedriver).toBeCalledWith({
                foo: 'bar',
                port: 1234,
                cacheDir: expect.any(String)
            })
            expect(options.capabilities.browserName).toBe('MicrosoftEdge')
        })

        it('should start chrome driver', async () => {
            const options = {
                capabilities: {
                    browserName: 'chrome',
                    'wdio:chromedriverOptions': { foo: 'bar' }
                } as any
            }
            const res = await startWebDriver(options)
            expect(Boolean(res?.stdout)).toBe(true)
            expect(options).toEqual({
                hostname: '0.0.0.0',
                port: 1234,
                capabilities: {
                    browserName: 'chrome',
                    'goog:chromeOptions': {
                        binary: expect.any(String)
                    },
                    'wdio:chromedriverOptions': {
                        allowedIps: [''],
                        allowedOrigins: ['*'],
                        'foo': 'bar',
                    },
                }
            })
            expect(fsp.access).toBeCalledTimes(2)
            expect(fsp.mkdir).toBeCalledTimes(1)
            expect(cp.spawn).toBeCalledTimes(1)
            expect(cp.spawn).toBeCalledWith(
                '/foo/bar/executable',
                ['--port=1234', '--foo=bar', '--allowed-origins=*', '--allowed-ips=']
            )
        })

        it('should find last known good version for chromedriver', async () => {
            const options = {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '115.0.5790.171',
                    'wdio:chromedriverOptions': { foo: 'bar' }
                } as any
            }
            vi.mocked(install)
                .mockResolvedValueOnce({} as any)
                .mockRejectedValueOnce(new Error('boom'))
                .mockResolvedValue({} as any)
            await startWebDriver(options)
            expect(install).toBeCalledTimes(3)
            expect(install).toBeCalledWith(expect.objectContaining({
                buildId: '115.0.5790.171',
                browser: 'chrome'
            }))
            expect(install).toBeCalledWith(expect.objectContaining({
                buildId: '115.0.5790.171',
                browser: 'chromedriver'
            }))
            expect(install).toBeCalledWith(expect.objectContaining({
                buildId: '115.0.5790.170',
                browser: 'chromedriver'
            }))
        })

        it('should pipe logs into a file', async () => {
            const options: any = {
                outputDir: '/foo/bar',
                capabilities: {
                    browserName: 'chrome',
                    'wdio:chromedriverOptions': { foo: 'bar' }
                } as any
            }

            delete process.env.WDIO_WORKER_ID

            await startWebDriver(options)
            expect(fs.createWriteStream).toBeCalledTimes(1)
            expect(fs.createWriteStream).toBeCalledWith(
                expect.stringContaining('wdio-chromedriver-1234.log'),
                { flags: 'w' }
            )

            process.env.WDIO_WORKER_ID = '1-2'
            delete options.hostname
            delete options.port
            await startWebDriver(options)
            expect(fs.createWriteStream).toBeCalledTimes(2)
            expect(fs.createWriteStream).toBeCalledWith(
                expect.stringContaining('wdio-1-2-chromedriver.log'),
                { flags: 'w' }
            )
        })
    })
)

