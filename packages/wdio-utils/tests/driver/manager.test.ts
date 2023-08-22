import path from 'node:path'
import { describe, test, expect, vi, beforeEach } from 'vitest'

import type * as utils from '../../src/driver/utils.js'
import { setupChromedriver, setupEdgedriver, setupGeckodriver, setupPuppeteerBrowser } from '../../src/driver/utils.js'
import { setupDriver, setupBrowser } from '../../src/driver/manager.js'

vi.mock('../../src/driver/utils.js', async (orig) => {
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
            browserName: 'edge'
        }, {
            browserName: 'firefox',
            browserVersion: '5'
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
            browserF: {
                capabilities: {
                    browserName: 'firefox',
                    browserVersion: '6'
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
        expect(setupGeckodriver).toBeCalledWith('/foo/bar', '6')
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
