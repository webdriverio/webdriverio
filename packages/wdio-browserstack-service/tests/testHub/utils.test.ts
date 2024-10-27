import { describe, expect, it, vi, beforeEach } from 'vitest'
import path from 'node:path'
import logger from '@wdio/logger'
import * as utils from '../../src/testHub/utils.js'
import * as bstackLogger from '../../src/bstackLogger.js'
import { BROWSERSTACK_OBSERVABILITY, BROWSERSTACK_ACCESSIBILITY } from '../../src/constants.js'

describe('getProductMap', () => {
    let config = {}

    beforeEach(() => {
        config = {
            testObservability: {
                enabled : true
            },
            accessibility: false,
            percy: false,
            automate: true,
            appAutomate: false
        }
    })

    it('should create a valid product map', () => {
        const productMap = utils.getProductMap(config as any)
        const expectedProductMap = {
            'observability': true,
            'accessibility': false,
            'percy': false,
            'automate': true,
            'app_automate': false
        }
        expect(productMap).toEqual(expectedProductMap)
    })
})

describe('shouldProcessEventForTesthub', () => {
    beforeEach(() => {
        delete process.env['BROWSERSTACK_OBSERVABILITY']
        delete process.env['BROWSERSTACK_ACCESSIBILITY']
        delete process.env['BROWSERSTACK_PERCY']
    })

    it('should return true when only observability is true', () => {
        process.env['BROWSERSTACK_OBSERVABILITY'] = 'true'
        expect(utils.shouldProcessEventForTesthub('')).to.equal(true)
    })

    it('should return true when only accessibility is true', () => {
        process.env['BROWSERSTACK_ACCESSIBILITY'] = 'true'
        expect(utils.shouldProcessEventForTesthub('')).to.equal(true)
    })

    it('should return true when only percy is true', () => {
        process.env['BROWSERSTACK_PERCY'] = 'true'
        expect(utils.shouldProcessEventForTesthub('')).to.equal(true)
    })

    it('should be false for Hook event when accessibility is only true', () => {
        process.env['BROWSERSTACK_ACCESSIBILITY'] = 'true'
        expect(utils.shouldProcessEventForTesthub('HookRunFinished')).to.equal(false)
    })

    it('should be false for Log event when only percy is true', () => {
        process.env['BROWSERSTACK_PERCY'] = 'true'
        expect(utils.shouldProcessEventForTesthub('CBTSessionCreated')).to.equal(false)
    })
})

describe('logBuildError', () => {
    const log = logger('test')
    vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
    const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
    bstackLoggerSpy.mockImplementation(() => {})

    it('should log error for ERROR_INVALID_CREDENTIALS', () => {
        vi.mocked(log.error).mockClear()
        const logErrorMock = vi.spyOn(log, 'error')
        const errorJson = {
            errors: [
                {
                    key: 'ERROR_INVALID_CREDENTIALS',
                    message: 'Access to BrowserStack Test Observability denied due to incorrect credentials.'
                }
            ],
        }
        utils.logBuildError(errorJson as any, 'observability')
        expect(logErrorMock.mock.calls[0][0]).toContain('Access to BrowserStack Test Observability denied due to incorrect credentials.')
    })

    it('should log error for ERROR_ACCESS_DENIED', () => {
        vi.mocked(log.error).mockClear()
        const logErrorMock = vi.spyOn(log, 'info')
        const errorJson = {
            errors: [
                {
                    key: 'ERROR_ACCESS_DENIED',
                    message: 'Access to BrowserStack Test Observability denied.'
                }
            ],
        }
        utils.logBuildError(errorJson as any, 'observability')
        expect(logErrorMock.mock.calls[0][0]).toContain('Access to BrowserStack Test Observability denied.')
    })

    it('should log error for ERROR_SDK_DEPRECATED', () => {
        vi.mocked(log.error).mockClear()
        vi.mocked(log.info).mockClear()
        const logErrorMock = vi.spyOn(log, 'error')
        const errorJson = {
            errors: [
                {
                    key: 'ERROR_SDK_DEPRECATED',
                    message: 'Access to BrowserStack Test Observability denied due to SDK deprecation.'
                }
            ],
        }
        utils.logBuildError(errorJson as any, 'observability')
        expect(logErrorMock.mock.calls[0][0]).toContain('Access to BrowserStack Test Observability denied due to SDK deprecation.')
    })

    it('should log error for RANDOM_ERROR_TYPE', () => {
        vi.mocked(log.error).mockClear()
        vi.mocked(log.info).mockClear()
        const logErrorMock = vi.spyOn(log, 'error')
        const errorJson = {
            errors: [
                {
                    key: 'RANDOM_ERROR_TYPE',
                    message: 'Random error message.'
                }
            ],
        }
        utils.logBuildError(errorJson as any, 'observability')
        expect(logErrorMock.mock.calls[0][0]).toContain('Random error message.')
    })

    it('should log error if error is null', () => {
        vi.mocked(log.error).mockClear()
        const logErrorMock = vi.spyOn(log, 'error')
        utils.logBuildError(null, 'product_name')
        expect(logErrorMock.mock.calls[0][0]).toContain('PRODUCT_NAME Build creation failed ')
    })

    it('handleErrorForObservability', () => {
        const errorJson = {
            errors: [
                {
                    key: 'RANDOM_ERROR_TYPE',
                    message: 'Random error message.'
                }
            ],
        }
        utils.handleErrorForObservability(errorJson)
        expect(process.env[BROWSERSTACK_OBSERVABILITY]).toEqual('false')
    })

    it('handleErrorForAccessibility', () => {
        const errorJson = {
            errors: [
                {
                    key: 'RANDOM_ERROR_TYPE',
                    message: 'Random error message.'
                }
            ],
        }
        utils.handleErrorForAccessibility(errorJson)
        expect(process.env[BROWSERSTACK_ACCESSIBILITY]).toEqual('false')
    })
})
