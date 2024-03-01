import * as utils from '../src/util.js'
import BStackCleanup from '../src/cleanup.js'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import FunnelTestEvent from '../src/instrumentation/funnelInstrumentation.js'
import * as bstackLogger from '../src/bstackLogger.js'
const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('BStackCleanup', () => {
    let originalArgv
    let originalEnv

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

    it('startCleanup executes observability cleanup if --observability is present in argv', async () => {
        vi.spyOn(utils, 'stopBuildUpstream')
        process.argv.push('--observability')
        process.env.BS_TESTOPS_JWT = 'some jwt'

        await BStackCleanup.startCleanup()

        expect(utils.stopBuildUpstream).toHaveBeenCalledTimes(1)
    })

    describe('executeObservabilityCleanup', () => {
        const stopBuildUpstreamSpy = vi.spyOn(utils, 'stopBuildUpstream')

        it('does not invoke stop call for observability when jwt is not set', async () => {
            await BStackCleanup.executeObservabilityCleanup()
            expect(stopBuildUpstreamSpy).toBeCalledTimes(0)
        })

        it('invoke stop call for observability when jwt is set', async () => {
            process.env.BS_TESTOPS_JWT = 'jwtToken'
            await BStackCleanup.executeObservabilityCleanup()
            expect(stopBuildUpstreamSpy).toBeCalledTimes(1)
        })
    })

    describe('sendFunnelData', () => {
        it('handles invalid file path', async () => {
            process.argv.push('--funnelData')
            vi.spyOn(FunnelTestEvent, 'fireRequest').mockResolvedValueOnce()
            await BStackCleanup.sendFunnelData()
            expect(FunnelTestEvent.fireRequest).not.toHaveBeenCalled()
        })

        it('sends funnel data and removes file', async () => {
            process.argv.push('--funnelData', 'test-file-path')
            const funnelData = { key: 'value' }
            vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(JSON.stringify(funnelData))
            vi.spyOn(fs, 'rmSync')
            vi.spyOn(FunnelTestEvent, 'fireRequest').mockResolvedValueOnce()
            await BStackCleanup.sendFunnelData()
            expect(FunnelTestEvent.fireRequest).toHaveBeenCalledWith(funnelData)
            expect(fs.rmSync).toHaveBeenCalledWith('test-file-path', { force: true })
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

