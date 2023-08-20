import fsp from 'node:fs/promises'
import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { start as startSafaridriver } from 'safaridriver'
import { start as startGeckodriver } from 'geckodriver'
import { start as startEdgedriver } from 'edgedriver'
import { install } from '@puppeteer/browsers'

import * as drivers from '../../src/driver/index.js'

const startWebDriver = drivers.startWebDriver

vi.mock('../../src/driver/utils', async () => {
    const origUtils = await vi.importActual('../../src/driver/utils.js') as any

    const mod = {
        installDMG: vi.fn().mockResolvedValue(void 0),
        extractTar: vi.fn().mockResolvedValue(void 0),
        downloadFile: vi.fn().mockResolvedValue(void 0),
        unpackArchive: vi.fn().mockImplementation((archivePath: string, folderPath: string) => {
            fs.mkdirSync(folderPath, { recursive: true })
        }),

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

        getFirefoxInfo: vi.fn().mockResolvedValue({
            'firefox-102.14.0esr': {
                'build_number': 1,
                'category': 'stability',
                'date': '2023-08-01',
                'description': null,
                'is_security_driven': false,
                'product': 'firefox',
                'version': '102.14.0'
            },
            'firefox-114.0b9': {
                'build_number': 1,
                'category': 'dev',
                'date': '2023-05-26',
                'description': null,
                'is_security_driven': false,
                'product': 'firefox',
                'version': '114.0b9'
            },
            'firefox-115.1.0esr': {
                'build_number': 1,
                'category': 'esr',
                'date': '2023-08-01',
                'description': null,
                'is_security_driven': false,
                'product': 'firefox',
                'version': '115.1.0'
            },
            'firefox-114.0.1': {
                'build_number': 1,
                'category': 'stability',
                'date': '2023-06-09',
                'description': null,
                'is_security_driven': false,
                'product': 'firefox',
                'version': '114.0.1'
            },
            'firefox-116.0.3': {
                'build_number': 2,
                'category': 'stability',
                'date': '2023-08-16',
                'description': null,
                'is_security_driven': false,
                'product': 'firefox',
                'version': '116.0.3'
            },
            'firefox-117.0b9': {
                'build_number': 1,
                'category': 'dev',
                'date': '2023-08-18',
                'description': null,
                'is_security_driven': false,
                'product': 'firefox',
                'version': '117.0b9'
            },
        }),
    }

    return {
        __esModule: true,
        ...origUtils,
        ...mod
    }
})

vi.mock('node:fs/promises', async () => {

    const origFS = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')

    const mod = {
        access: vi.fn().mockRejectedValue(new Error('boom')),
        mkdir: vi.fn()
    }

    return {
        ...origFS,
        ...mod,
        default: {
            ...origFS,
            ...mod,
        }
    }
})

vi.mock('node:fs', async () => {

    const origFS = await vi.importActual<typeof import('node:fs')>('node:fs')

    const mod = {
        createWriteStream: vi.fn()
    }

vi.mock('node:os', async (origMod) => ({
    default: {
        ...(await origMod<any>()),
        platform: vi.fn().mockReturnValue('linux')
    }
}))

vi.mock('node:child_process', async () => {

    const origCP = await vi.importActual<typeof import('node:child_process')>('node:child_process')

    const mod = {
        spawn: vi.fn().mockReturnValue({
            stdout: { pipe: vi.fn() },
            stderr: { pipe: vi.fn() }
        }),
        execSync: vi.fn().mockReturnValue(Buffer.from('115.0.5790.171'))
    }

    return {
        ...origCP,
        ...mod,
        default: {
            ...origCP,
            ...mod,
        }
    }
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

vi.mock('@puppeteer/browsers', async () => {

    const origPB = await vi.importActual<typeof import('@puppeteer/browsers')>('@puppeteer/browsers')

    const mod = {
        ChromeReleaseChannel: { STABLE: 'stable' },
        detectBrowserPlatform: vi.fn().mockReturnValue('mac_arm'),
        resolveBuildId: vi.fn().mockReturnValue('115.0.5790.171'),
        canDownload: vi.fn().mockResolvedValue(true),
        computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
        getInstalledBrowsers: vi.fn().mockResolvedValue([]),
        install: vi.fn().mockResolvedValue({}),
    }

    return {
        ...origPB,
        ...mod,
        default: {
            ...origPB,
            ...mod,
        }
    }
})

vi.mock('../../src/driver/detectBackend.js', () => ({
    default: vi.fn().mockReturnValue({
        hostname: 'cloudprovider.com'
    })
}))

describe('startWebDriver', () => {
    const WDIO_SKIP_DRIVER_SETUP = process.env.WDIO_SKIP_DRIVER_SETUP
    beforeEach(() => {
        delete process.env.WDIO_SKIP_DRIVER_SETUP
        vi.mocked(install).mockClear()
        vi.mocked(fsp.access).mockClear()
        vi.mocked(fsp.mkdir).mockClear()
        vi.mocked(startGeckodriver).mockClear()
        vi.mocked(fs.createWriteStream).mockClear()
    })

    afterEach(() => {
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]118[.]0a1[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]118[.]0a1[/]firefox$/,
                        win32: /[-]118[.]0a1[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]102[.]14[.]0esr[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]102[.]14[.]0esr[/]firefox$/,
                        win32: /[-]102[.]14[.]0esr[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]117[.]0b9dev[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]117[.]0b9dev[/]firefox$/,
                        win32: /[-]117[.]0b9dev[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]117[.]0b9[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]117[.]0b9[/]firefox$/,
                        win32: /[-]117[.]0b9[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]116[.]0[.]3[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]116[.]0[.]3[/]firefox$/,
                        win32: /[-]116[.]0[.]3[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]118[.]0a1[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]118[.]0a1[/]firefox$/,
                        win32: /[-]118[.]0a1[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

        expect(params).toEqual({
            hostname: '0.0.0.0',
            port: 1234,
            capabilities: {
                browserName: 'firefox',
                'browserVersion': '115.1.0',
                'wdio:geckodriverOptions': {
                    foo: 'bar'
                },
                'moz:firefoxOptions': expect.objectContaining({
                    binary: expect.stringMatching({
                        darwin: /[-]115[.]1[.]0esr[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]115[.]1[.]0esr[/]firefox$/,
                        win32: /[-]115[.]1[.]0esr[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]117[.]0b2dev[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]117[.]0b2dev[/]firefox$/,
                        win32: /[-]117[.]0b2dev[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]117[.]0b2[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]117[.]0b2[/]firefox$/,
                        win32: /[-]117[.]0b2[/]firefox[.]exe$/
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

        const OS: 'win32' | 'darwin' | 'linux' = ['win32', 'darwin', 'linux'].includes(os.platform())
            ? os.platform() as 'win32' | 'darwin' | 'linux'
            : 'linux'

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
                        darwin: /[-]114[.]0[.]1[/]Firefox.*[.]app[/]Contents[/]MacOS[/]firefox-bin$/,
                        linux: /[-]114[.]0[.]1[/]firefox$/,
                        win32: /[-]114[.]0[.]1[/]firefox[.]exe$/
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
                'ms:edgeOptions': {
                    binary: '/foo/bar/executable'
                }
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
