import * as DataStore from '../../src/data-store'
import fs from 'node:fs'

jest.mock('../../src/bstackLogger', () => ({
    BStackLogger: {
        debug: jest.fn(),
    },
}))
jest.mock('node:fs', () => ({
    readdirSync: jest.fn(),
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    rmSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn()
}))

describe('DataStore', () => {
    let mockFs: any
    beforeEach(() => {
        mockFs = jest.mocked(fs)
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('getDataFromWorkers - reads files and returns data when directory exists', async () => {
        const mockFiles = ['worker-data-1.json', 'worker-data-2.json']
        const mockFileData1 = { data1: 'value1' }
        const mockFileData2 = { data2: 'value2' }

        // Mock fs methods
        mockFs.existsSync.mockReturnValueOnce(true)
        mockFs.readdirSync.mockReturnValueOnce(mockFiles as any)
        mockFs.readFileSync.mockImplementation((filePath) => {
            if (filePath.includes(mockFiles[0])) {
                return JSON.stringify(mockFileData1)
            } else if (filePath.includes(mockFiles[1])) {
                return JSON.stringify(mockFileData2)
            }
            throw new Error(`Unexpected file access: ${filePath}`)
        })

        const workerData = DataStore.getDataFromWorkers()

        expect(workerData).toEqual([mockFileData1, mockFileData2])

        // Verify fs method calls
        expect(mockFs.existsSync).toHaveBeenCalledTimes(1)
        expect(mockFs.readdirSync).toHaveBeenCalledTimes(1)
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
        expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1)
        const expectedFileName = 'worker-data-' + process.pid + '.json'
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining(expectedFileName), JSON.stringify(testData))

        // No need to cleanup as fs methods are mocked
    })
})
