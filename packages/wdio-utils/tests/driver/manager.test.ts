import path from 'node:path'
import { describe, test, expect, vi, beforeEach } from 'vitest'

import { setupEdgedriver } from '../../src/driver/edge.js'
import { setupChromedriver, setupChrome } from '../../src/driver/chrome.js'
import { setupGeckodriver } from '../../src/driver/firefox.js'
import { setupDriver, setupBrowser } from '../../src/driver/manager.js'

vi.mock('../../src/driver/edge.js', async (orig) => {
    const origMod = await orig() as any
    return {
        ...origMod,
        setupEdgedriver: vi.fn(),
    }
})

vi.mock('../../src/driver/firefox.js', async (orig) => {
    const origMod = await orig() as any
    return {
        ...origMod,
        setupGeckodriver: vi.fn(),
    }
})

vi.mock('../../src/driver/chrome.js', async (orig) => {
    const origMod = await orig() as any
    return {
        ...origMod,
        setupChromedriver: vi.fn(),
        setupChrome: vi.fn(),
    }
})

vi.mock('../../src/driver/utils.js', async (orig) => {
    const origMod = await orig() as any
    return {
        ...origMod,
        getCacheDir: vi.fn().mockReturnValue('/foo/bar'),
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
        vi.mocked(setupChrome).mockClear()
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
        expect(setupChrome).toBeCalledTimes(2)
        expect(setupChrome).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '1'
        })
        expect(setupChrome).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '2'
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
        expect(setupChrome).toBeCalledTimes(2)
        expect(setupChrome).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '1'
        })
        expect(setupChrome).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '2'
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
        expect(setupChrome).toBeCalledTimes(2)
        expect(setupChrome).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '1'
        })
        expect(setupChrome).toBeCalledWith('/foo/bar', {
            browserName: 'chrome',
            browserVersion: '2'
        })
    })
})
