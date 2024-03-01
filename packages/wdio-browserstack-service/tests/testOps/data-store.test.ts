
import { expect, vi, it, describe, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import DataStore from '../../src/data-store.js'
import fs from 'node:fs'

vi.mock('../../src/bstackLogger.js', () => ({
    BStackLogger: {
        debug: vi.fn(),
    },
}))

describe('DataStore', () => {
    let mockFs: any
    beforeEach(() => {
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
        mockFs = vi.mocked(fs)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('getDataFromWorkers - reads files and returns data when directory exists', async () => {
        const mockDir = '/path/to/worker_data'
        const mockFiles = ['worker-data-1.json', 'worker-data-2.json']
        const mockFileData1 = { data1: 'value1' }
        const mockFileData2 = { data2: 'value2' }

        // Mock fs methods
        mockFs.existsSync.mockReturnValueOnce(true)
        mockFs.readdirSync.mockReturnValueOnce(mockFiles as any)
        mockFs.readFileSync.mockImplementation((filePath) => {
            if (filePath === path.join(mockDir, mockFiles[0])) {
                return JSON.stringify(mockFileData1)
            } else if (filePath === path.join(mockDir, mockFiles[1])) {
                return JSON.stringify(mockFileData2)
            }
            throw new Error(`Unexpected file access: ${filePath}`)
        })

        DataStore.workersDataDirPath = mockDir

        const workerData = DataStore.getDataFromWorkers()

        expect(workerData).toEqual([mockFileData1, mockFileData2])

        // Verify fs method calls
        expect(mockFs.existsSync).toHaveBeenCalledOnce()
        expect(mockFs.readdirSync).toHaveBeenCalledOnce()
        expect(mockFs.readFileSync).toHaveBeenCalledTimes(2)
        expect(mockFs.rmSync).toHaveBeenCalledTimes(1)
    })

    it('getDataFromWorkers - returns empty array when directory does not exist', () => {
        // Mock fs.existsSync to return false
        mockFs.existsSync.mockReturnValueOnce(false)

        const workerData = DataStore.getDataFromWorkers()
        expect(workerData).toEqual([])
    })

    it('saveWorkerData - saves data to a file (mocked)', () => {
        const testData = { test: 'value' }

        // Mock fs.writeFileSync
        mockFs.writeFileSync.mockImplementationOnce(() => {
        })

        DataStore.saveWorkerData(testData)

        // Verify fs method calls with arguments
        expect(mockFs.writeFileSync).toHaveBeenCalledOnce()
        const expectedFilePath = path.join(DataStore.workersDataDirPath, 'worker-data-' + process.pid + '.json')
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(expectedFilePath, JSON.stringify(testData))

        // No need to cleanup as fs methods are mocked
    })

    it('removeWorkersDataDir - calls rmSync', () => {
        DataStore.removeWorkersDataDir()

        // Verify fs methods are not called
        expect(mockFs.rmSync).toHaveBeenCalled()
    })

    it('createWorkersDataDir - does not create if already exists', () => {
        mockFs.existsSync.mockReturnValueOnce(true)
        DataStore.createWorkersDataDir()

        // Verify fs methods are not called
        expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })
})
