import { expect, vi, it, describe, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'

import * as OpenRunsJournal from '../../src/testOps/openRunsJournal.js'
import * as utils from '../../src/util.js'

vi.mock('../../src/bstackLogger.js', () => ({
    BStackLogger: {
        debug: vi.fn(),
        info: vi.fn(),
    },
}))

vi.mock('fs', () => ({
    default: {
        readdirSync: vi.fn(),
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        rmSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn()
    }
}))

describe('openRunsJournal', () => {
    let mockFs: any
    beforeEach(() => {
        vi.clearAllMocks()
        mockFs = vi.mocked(fs)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('recordOpenRun', () => {
        it('persists the started test data keyed by uuid', () => {
            const testData = { uuid: 'uuid-1', name: 'my test', started_at: new Date().toISOString() }
            OpenRunsJournal.recordOpenRun(testData)
            expect(mockFs.mkdirSync).toHaveBeenCalledOnce()
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('open-run-uuid-1.json'), JSON.stringify(testData))
        })

        it('is a no-op without a uuid and never throws on fs errors', () => {
            OpenRunsJournal.recordOpenRun({} as any)
            expect(mockFs.writeFileSync).not.toHaveBeenCalled()

            mockFs.writeFileSync.mockImplementationOnce(() => { throw new Error('disk full') })
            expect(() => OpenRunsJournal.recordOpenRun({ uuid: 'uuid-err' })).not.toThrow()
        })
    })

    describe('clearOpenRun', () => {
        it('removes the journal entry for the finished test', () => {
            OpenRunsJournal.clearOpenRun('uuid-2')
            expect(mockFs.rmSync).toHaveBeenCalledWith(expect.stringContaining('open-run-uuid-2.json'), { force: true })
        })

        it('is a no-op without a uuid', () => {
            OpenRunsJournal.clearOpenRun(undefined)
            expect(mockFs.rmSync).not.toHaveBeenCalled()
        })
    })

    describe('collectOrphanedRuns', () => {
        it('returns [] when the journal dir does not exist', () => {
            mockFs.existsSync.mockReturnValueOnce(false)
            expect(OpenRunsJournal.collectOrphanedRuns()).toEqual([])
        })

        it('reads every journal file, removes the dir and skips unreadable entries', () => {
            mockFs.existsSync.mockReturnValueOnce(true)
            mockFs.readdirSync.mockReturnValueOnce(['open-run-a.json', 'open-run-bad.json'] as any)
            mockFs.readFileSync.mockImplementation((filePath: string) => {
                if (filePath.includes('open-run-a.json')) {
                    return JSON.stringify({ uuid: 'a' })
                }
                throw new Error('corrupt')
            })
            const orphans = OpenRunsJournal.collectOrphanedRuns()
            expect(orphans).toEqual([{ uuid: 'a' }])
            expect(mockFs.rmSync).toHaveBeenCalledWith(expect.stringContaining('bstack_open_runs'), { recursive: true, force: true })
        })
    })

    describe('finalizeOrphanedRuns', () => {
        it('does nothing when there are no orphans', async () => {
            mockFs.existsSync.mockReturnValueOnce(false)
            const batchSpy = vi.spyOn(utils, 'batchAndPostEvents').mockResolvedValueOnce(undefined as any)
            expect(await OpenRunsJournal.finalizeOrphanedRuns()).toBe(0)
            expect(batchSpy).not.toHaveBeenCalled()
        })

        it('posts a failed TestRunFinished per orphan and reports the count', async () => {
            const startedAt = new Date(Date.now() - 5000).toISOString()
            mockFs.existsSync.mockReturnValueOnce(true)
            mockFs.readdirSync.mockReturnValueOnce(['open-run-a.json'] as any)
            mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ uuid: 'a', name: 'stuck test', started_at: startedAt }))
            const batchSpy = vi.spyOn(utils, 'batchAndPostEvents').mockResolvedValueOnce(undefined as any)

            expect(await OpenRunsJournal.finalizeOrphanedRuns()).toBe(1)

            expect(batchSpy).toHaveBeenCalledOnce()
            const [, kind, events] = batchSpy.mock.calls[0]
            expect(kind).toBe('ORPHANED_TEST_RUN_FINALIZATION')
            expect(events).toHaveLength(1)
            const event = (events as any)[0]
            expect(event.event_type).toBe('TestRunFinished')
            expect(event.test_run.uuid).toBe('a')
            expect(event.test_run.result).toBe('failed')
            expect(event.test_run.failure_reason).toBe(OpenRunsJournal.ORPHAN_FAILURE_REASON)
            expect(event.test_run.finished_at).toBeTruthy()
            expect(event.test_run.duration_in_ms).toBeGreaterThanOrEqual(5000)
        })

        it('swallows upload failures and returns 0', async () => {
            mockFs.existsSync.mockReturnValueOnce(true)
            mockFs.readdirSync.mockReturnValueOnce(['open-run-a.json'] as any)
            mockFs.readFileSync.mockReturnValueOnce(JSON.stringify({ uuid: 'a' }))
            vi.spyOn(utils, 'batchAndPostEvents').mockRejectedValueOnce(new Error('no jwt'))
            expect(await OpenRunsJournal.finalizeOrphanedRuns()).toBe(0)
        })
    })
})
