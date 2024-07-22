/// <reference path="../../webdriverio/src/@types/async.d.ts" />
import path from 'node:path'

import { describe, expect, it, vi, beforeEach } from 'vitest'
import aiSDK from '@browserstack/ai-sdk-node'

import AiHandler from '../src/ai-handler.js'
import * as bstackLogger from '../src/bstackLogger.js'

// Mock only the external dependency
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@browserstack/ai-sdk-node')
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('AiHandler', () => {
    let config: any

    beforeEach(() => {
        config = {
            user: 'foobaruser',
            key: '12345',
            selfHeal: true
        }
    })

    describe('authenticateUser', () => {
        it('should authenticate user', async () => {
            const authResponse = {
                message: 'Authentication successful',
                isAuthenticated: true,
                defaultLogDataEnabled: true,
                isHealingEnabled: true,
                sessionToken: 'test-token',
                groupId: 123123,
                userId: 342423,
                isGroupAIEnabled: true,
            }

            // Spy on aiSDK.BrowserstackHealing.init
            const initSpy = vi.spyOn(aiSDK.BrowserstackHealing, 'init')
                .mockReturnValue(Promise.resolve(authResponse) as any)

            const result = await AiHandler.authenticateUser(config)

            expect(initSpy).toHaveBeenCalledTimes(1)
            expect(initSpy).toHaveBeenCalledWith(
                config.key,
                config.user,
                'https://tcg.browserstack.com',
                expect.any(String)
            )
            expect(result).toEqual(authResponse)
        })
    })
})