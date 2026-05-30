import fs from 'node:fs'
import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from 'vitest'

import BStackCleanup from '../src/cleanup.js'
import { stopBuildUpstream } from '../src/util.js'
import { fireFunnelRequest } from '../src/instrumentation/funnelInstrumentation.js'
import { BROWSERSTACK_TESTHUB_JWT } from '../src/constants.js'
import type { FunnelData } from '../src/types.js'

vi.mock('../src/util.js', () => ({
    stopBuildUpstream: vi.fn()
}))

vi.mock('../src/instrumentation/funnelInstrumentation.js', () => ({
    fireFunnelRequest: vi.fn()
}))

vi.mock('../src/bstackLogger.js', async (original) => {
    return {
        ...(await original()) as any,
        logToFile: vi.fn().mockImplementation(() => {})
    }
})

describe('BStackCleanup', () => {
    let originalArgv: string[]
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        originalArgv = process.argv
        originalEnv = process.env
        process.argv = []
        process.env = {}
    })

    afterEach(() => {
        process.argv = originalArgv
        process.env = originalEnv
        vi.resetAllMocks()
        vi.restoreAllMocks()
    })

    describe('startCleanup', () => {
        it('executes test reporting cleanup if --observability is present in argv', async () => {
            process.argv.push('--observability', '--funnelData')
            process.env[BROWSERSTACK_TESTHUB_JWT] = 'some jwt'

            vi.spyOn(BStackCleanup, 'getFunnelDataFromFile').mockReturnValue({ data: 123 })
            await BStackCleanup.startCleanup()

            expect(stopBuildUpstream).toHaveBeenCalledTimes(1)
        })

        it('gets data and removes funnel data file', async () => {
            vi.fn()
            const filePath = 'some_file.json'
            process.argv.push('--funnelData', filePath)
            vi.spyOn(fs, 'readFileSync').mockReturnValue('{"data": 123}')
            vi.spyOn(fs, 'rmSync')
            ;(fireFunnelRequest as unknown as Mock).mockResolvedValueOnce(undefined)

            await BStackCleanup.startCleanup()
            expect(fs.readFileSync).toHaveBeenNthCalledWith(1, filePath, 'utf8')
            expect(fs.rmSync).toHaveBeenNthCalledWith(1, filePath, expect.any(Object))
            expect(fireFunnelRequest).toHaveBeenCalled()
        })
    })

    describe('executeTestReportingCleanup (legacy executeObservabilityCleanup)', () => {
        it('does not invoke stop call for test reporting when jwt is not set', async () => {
            await BStackCleanup.executeObservabilityCleanup({} as any)
            expect(stopBuildUpstream).toBeCalledTimes(0)
        })

        it('invoke stop call for test reporting when jwt is set', async () => {
            process.env[BROWSERSTACK_TESTHUB_JWT] = 'jwtToken'
            await BStackCleanup.executeObservabilityCleanup({} as any)
            expect(stopBuildUpstream).toBeCalledTimes(1)
        })
    })

    describe('sendFunnelData', () => {
        it('sends funnel data and removes file', async () => {
            const funnelData = { key: 'value' } as unknown as FunnelData
            ;(fireFunnelRequest as unknown as Mock).mockResolvedValueOnce(undefined)
            await BStackCleanup.sendFunnelData(funnelData)
            expect(fireFunnelRequest).toHaveBeenCalledWith(funnelData)
        })
    })

    describe('removeFunnelDataFile', () => {
        it('removes file if filePath is provided', () => {
            vi.spyOn(fs, 'rmSync')
            BStackCleanup.removeFunnelDataFile('test-file-path')
            expect(fs.rmSync).toHaveBeenCalledWith('test-file-path', { force: true })
        })

        it('does nothing if filePath is not provided', () => {
            vi.spyOn(fs, 'rmSync')
            BStackCleanup.removeFunnelDataFile()
            expect(fs.rmSync).not.toHaveBeenCalled()
        })
    })
})

