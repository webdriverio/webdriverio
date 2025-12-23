import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import '../src/browser.js'

import { startWebDriverSession } from '../src/utils.js'
import type { RemoteConfig } from '../src/types.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/utils')
vi.mock('fetch')

describe('grid compatibility', () => {
    const mockedFetch = vi.mocked(fetch)

    afterEach(() => {
        mockedFetch.mockClear()
    })

    it('should not produce overlapping keys between alwaysMatch and firstMatch when vendor caps are duplicated', async () => {
        const params: RemoteConfig = {
            hostname: 'localhost',
            port: 4444,
            path: '/',
            protocol: 'http',
            capabilities: {
                alwaysMatch: {
                    browserName: 'chrome',
                    'requester:project-id': 'my-project',
                    'requester:project-branch-id': 'main'
                },
                firstMatch: [
                    {
                        browserName: 'chrome',
                        'requester:project-id': 'my-project',
                        'requester:project-branch-id': 'main'
                    }
                ]
            }
        }

        await startWebDriverSession(params)

        const body = mockedFetch.mock.calls[0]?.[1]?.body as string
        expect(body).toBeTruthy()
        const payload = JSON.parse(body)
        const am = payload.capabilities.alwaysMatch
        const fm0 = payload.capabilities.firstMatch[0]

        const amKeys = Object.keys(am)
        const fmKeys = Object.keys(fm0)
        const overlap = ['requester:project-id', 'requester:project-branch-id']
            .filter((k) => amKeys.includes(k) && fmKeys.includes(k))

        // Desired behavior: WDIO should normalize capabilities to avoid overlaps
        expect(overlap).toEqual([])
    })

    it('should handle conflicting overlaps by moving alwaysMatch to firstMatch', async () => {
        const params: RemoteConfig = {
            hostname: 'localhost',
            port: 4444,
            path: '/',
            protocol: 'http',
            capabilities: {
                alwaysMatch: {
                    browserName: 'chrome',
                    // @ts-ignore
                    'my:option': 'default'
                },
                firstMatch: [
                    {
                        // @ts-ignore
                        'my:option': 'special'
                    },
                    {
                        // keeps default
                    }
                ]
            }
        }
        await startWebDriverSession(params)
        const body = JSON.parse(mockedFetch.mock.calls[0][1]?.body as string)

        // Key should be removed from alwaysMatch because of conflict
        expect(body.capabilities.alwaysMatch['my:option']).toBeUndefined()

        // First entry should try 'special'
        expect(body.capabilities.firstMatch[0]['my:option']).toBe('special')

        // Second entry should contain 'default' (preserved from alwaysMatch)
        expect(body.capabilities.firstMatch[1]['my:option']).toBe('default')
    })

    it('should NOT treat structurally equal objects as conflicts', async () => {
        const params: RemoteConfig = {
            hostname: 'localhost',
            port: 4444,
            path: '/',
            protocol: 'http',
            capabilities: {
                alwaysMatch: {
                    browserName: 'chrome',
                    // @ts-ignore
                    'goog:chromeOptions': { args: ['headless'] }
                },
                firstMatch: [
                    {
                        // @ts-ignore
                        'goog:chromeOptions': { args: ['headless'] }
                    }
                ]
            }
        }
        await startWebDriverSession(params)
        const body = JSON.parse(mockedFetch.mock.calls[0][1]?.body as string)

        // Key should stay in alwaysMatch (no conflict) and be removed from firstMatch
        expect(body.capabilities.alwaysMatch['goog:chromeOptions']).toEqual({ args: ['headless'] })
        expect(body.capabilities.firstMatch[0]['goog:chromeOptions']).toBeUndefined()
    })

})
