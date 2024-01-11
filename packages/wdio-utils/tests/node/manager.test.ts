import path from 'node:path'
import { describe, test, expect, vi, beforeEach } from 'vitest'

import type * as utils from '../../src/node/utils.js'
import { setupChromedriver, setupEdgedriver, setupGeckodriver, setupPuppeteerBrowser } from '../../src/node/utils.js'
import { setupDriver, setupBrowser } from '../../src/node/manager.js'

vi.mock('../../src/node/utils.js', async (orig) => {
    const origMod = await orig<typeof utils>()
    return {
        ...origMod,
        getCacheDir: vi.fn().mockReturnValue('/foo/bar'),
        setupChromedriver: vi.fn(),
        setupEdgedriver: vi.fn(),
        setupGeckodriver: vi.fn(),
        setupPuppeteerBrowser: vi.fn()
    }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setupDriver', () => {
    beforeEach(() => {
        vi.mocked(setupChromedriver).mockClear()
        vi.mocked(setupEdgedriver).mockClear()
        vi.mocked(setupGeckodriver).mockClear()
    })

    test('with testrunner capabilities', async () => {
        await setupDriver({}, [{
            browserName: 'chrome',
            browserVersion: '1'
        }, {
            browserName: 'chrome',
            browserVersion: '2'
        }, {
            browserName: 'chrome',
            browserVersion: '2',
            'wdio:chromedriverOptions': {
                binary: 'foo'
            }
        }, {
            browserName: 'chrome',
            browserVersion: '3',
            'wdio:chromedriverOptions': {
                binary: 'foo'
            }
        }, {
            browserName: 'edge',
            browserVersion: '3'
        }, {
            browserName: 'edge',
            browserVersion: '3'
        }, {
            browserName: 'edge',
            browserVersion: '4'
        }, {
            browserName: 'edge'
        }, {
            browserName: 'edge',
            'wdio:edgedriverOptions': {
                binary: 'foo'
            }
        }, {
            browserName: 'edge'
        }, {
            browserName: 'firefox',
            browserVersion: '5'
        }, {
            browserName: 'firefox',
            browserVersion: '5',
            'wdio:geckodriverOptions': {
                binary: 'foo'
            }
        }, {
            browserName: 'firefox',
            browserVersion: '5'
        }, {
            browserName: 'firefox',
            browserVersion: '6'
        }])
        expect(setupChromedriver).toBeCalledTimes(2)
        expect(setupChromedriver).toBeCalledWith('/foo/bar', '1')
        expect(setupChromedriver).toBeCalledWith('/foo/bar', '2')
        expect(setupEdgedriver).toBeCalledTimes(3)
        expect(setupEdgedriver).toBeCalledWith('/foo/bar', undefined)
        expect(setupEdgedriver).toBeCalledWith('/foo/bar', '3')
        expect(setupEdgedriver).toBeCalledWith('/foo/bar', '4')
        expect(setupGeckodriver).toBeCalledTimes(2)
        expect(setupGeckodriver).toBeCalledWith('/foo/bar', '5')
        expect(setupGeckodriver).toBeCalledWith('/foo/bar', '6')
    })

    test('no setup with testrunner capabilities when automation protocol is set to devtools', async () => {
        await setupDriver({
            automationProtocol: 'devtools'
        } as any, [{
            browserName: 'chrome',
            browserVersion: '1'
        }, {
            browserName: 'firefox',
            browserVersion: '5'
        }, {
            browserName: 'edge',
            browserVersion: '4'
        }])
        expect(setupGeckodriver).toBeCalledTimes(0)
        expect(setupChromedriver).toBeCalledTimes(0)
        expect(setupEdgedriver).toBeCalledTimes(0)
    })

    test('with multiremote capabilities', async () => {
        await setupDriver({}, {
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '1'
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '2'
                }
            },
            browserBWithDriverBinary: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '3',
                    'wdio:chromedriverOptions': {
                        binary: 'foo'
                    }
                }
            },
            browserBRepeat: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '2'
                }
            },
            browserC: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '3'
                }
            },
            browserD: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '4'
                }
            },
            browserDRepeat: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '4'
                }
            },
            browserDWithDriverBinary: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '5',
                    'wdio:edgedriverOptions': {
                        binary: 'foo'
                    }
                }
            },
            browserE: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '5'
                }
            },
            browserERepeat: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '5'
                }
            },
            browserEWithDriverBinary: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '6',
                    'wdio:geckodriverOptions': {
                        binary: 'foo'
                    }
                }
            },
            browserF: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '7'
                }
            }
        })
        expect(setupChromedriver).toBeCalledTimes(2)
        expect(setupChromedriver).toBeCalledWith('/foo/bar', '1')
        expect(setupChromedriver).toBeCalledWith('/foo/bar', '2')
        expect(setupEdgedriver).toBeCalledTimes(2)
        expect(setupEdgedriver).toBeCalledWith('/foo/bar', '3')
        expect(setupEdgedriver).toBeCalledWith('/foo/bar', '4')
        expect(setupGeckodriver).toBeCalledTimes(2)
        expect(setupGeckodriver).toBeCalledWith('/foo/bar', '5')
        expect(setupGeckodriver).toBeCalledWith('/foo/bar', '7')
    })

    test('no setup with multiremote capabilities when automation protocol is set to devtools', async () => {
        await setupDriver({}, {
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '1'
                }
            },
            browserB: {
                automationProtocol: 'devtools',
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '3'
                }
            }
        })
        expect(setupChromedriver).toBeCalledTimes(1)
        expect(setupEdgedriver).toBeCalledTimes(0)
    })

    test('with multiremote capabilities series', async () => {
        await setupDriver({}, [{
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '1'
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '2'
                }
            },
            browserBWithDriverBinary: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '3',
                    'wdio:chromedriverOptions': {
                        binary: 'foo'
                    }
                }
            },
        }, {
            browserC: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '3'
                }
            },
            browserD: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '4'
                }
            },
            browserDRepeat: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '4'
                }
            },
            browserDWithDriverBinary: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '5',
                    'wdio:edgedriverOptions': {
                        binary: 'foo'
                    }
                }
            },
        }, {
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '1'
                }
            },
            browserE: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '5'
                }
            },
            browserF: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '6'
                }
            },
            browserFWithDriverBinary: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '7',
                    'wdio:geckodriverOptions': {
                        binary: 'foo'
                    }
                }
            }
        }])
        expect(setupChromedriver).toBeCalledTimes(2)
        expect(setupChromedriver).toBeCalledWith('/foo/bar', '1')
        expect(setupChromedriver).toBeCalledWith('/foo/bar', '2')
        expect(setupEdgedriver).toBeCalledTimes(2)
        expect(setupEdgedriver).toBeCalledWith('/foo/bar', '3')
        expect(setupEdgedriver).toBeCalledWith('/foo/bar', '4')
        expect(setupGeckodriver).toBeCalledTimes(2)
        expect(setupGeckodriver).toBeCalledWith('/foo/bar', '5')
        expect(setupGeckodriver).toBeCalledWith('/foo/bar', '6')
    })

    test('no setup with multiremote capabilities series when automation protocol is set to devtools', async () => {
        await setupDriver({}, [{
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '1'
                }
            },
            browserB: {
                automationProtocol: 'devtools',
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '2'
                }
            }
        }])
        expect(setupChromedriver).toBeCalledTimes(1)
    })
})

describe('setupBrowser', () => {
    beforeEach(() => {
        vi.mocked(setupPuppeteerBrowser).mockClear()
    })

    test('with testrunner capabilities', async () => {
        await setupBrowser({}, [{
            browserName: 'chrome',
            browserVersion: '1'
        }, {
            browserName: 'chrome',
            browserVersion: '2'
        }, {
            browserName: 'edge',
            browserVersion: '3'
        }, {
            browserName: 'edge',
            browserVersion: '4'
        }, {
            browserName: 'firefox',
            browserVersion: '5'
        }, {
            browserName: 'firefox',
            browserVersion: '6'
        }])
        expect(setupPuppeteerBrowser).toBeCalledTimes(4)
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '1'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '2'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'firefox',
            browserVersion: '5'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'firefox',
            browserVersion: '6'
        })
    })

    test('with multiremote capabilities', async () => {
        await setupBrowser({}, {
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '1'
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '2'
                }
            },
            browserC: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '3'
                }
            },
            browserD: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '4'
                }
            },
            browserE: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '5'
                }
            },
            browserF: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '6'
                }
            }
        })
        expect(setupPuppeteerBrowser).toBeCalledTimes(4)
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '1'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '2'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'firefox',
            browserVersion: '5'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'firefox',
            browserVersion: '6'
        })
    })

    test('with multiremote capabilities series', async () => {
        await setupBrowser({}, [{
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '1'
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    browserVersion: '2'
                }
            },
        }, {
            browserC: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '3'
                }
            },
            browserD: {
                capabilities: {
                    browserName: 'edge',
                    browserVersion: '4'
                }
            },
        }, {
            browserE: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '5'
                }
            },
            browserF: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '6'
                }
            }
        }])
        expect(setupPuppeteerBrowser).toBeCalledTimes(4)
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '1'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '2'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'firefox',
            browserVersion: '5'
        })
        expect(setupPuppeteerBrowser).toBeCalledWith('/foo/bar', {
            browserName: 'firefox',
            browserVersion: '6'
        })
    })
})
