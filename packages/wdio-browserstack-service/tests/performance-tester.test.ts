import fs from 'fs'
import PerformanceTester from '../src/performance-tester'

jest.mock('csv-writer', () => ({
    createObjectCsvWriter: jest.fn(() => ({
        writeRecords: jest.fn().mockResolvedValue(null),
    })),
}))

describe('PerformanceTester', function () {
    afterEach(() => {
        PerformanceTester['_events'] = []
        PerformanceTester.started = false
    })

    describe('startMonitoring', function () {
        it('should start monitoring', () => {
            expect(PerformanceTester.started).toBe(false)
            PerformanceTester.startMonitoring('temp.csv')
            expect(PerformanceTester.started).toBe(true)
        })

        it('should push to events for sync functions', async () => {
            const func = (a: number, b: number) => {
                return a + b
            }
            const timerifyFunc = PerformanceTester.getPerformance().timerify(func)
            timerifyFunc(1, 2)
            await new Promise(resolve => setTimeout(resolve, 100))
            expect(PerformanceTester['_events']).toEqual([expect.objectContaining({ name: 'func', entryType: 'function', duration: expect.any(Number) })])
        })
    })

    describe('calculateTimes', function () {
        it('should calculate execution times correctly', () => {
            const entries = [
                { name: 'function1', duration: 100 },
                { name: 'function2', duration: 200 },
                { name: 'function1', duration: 50 },
            ]
            PerformanceTester['_events'] = (entries as any)

            const methods = ['function1', 'function2']
            const totalTime = PerformanceTester.calculateTimes(methods)
            expect(totalTime).toEqual(350)
        })
    })

    describe('stopAndGenerate', function () {
        jest.spyOn(fs, 'writeFile').mockImplementation(() => {})

        it('should return if not started', async function () {
            await PerformanceTester.stopAndGenerate('sdf')
            expect(fs.writeFile).toBeCalledTimes(0)
        })

        it('should stop and write generate HTML', async () => {
            PerformanceTester.startMonitoring('temp.csv')
            await PerformanceTester.stopAndGenerate('temp.html')
            expect(PerformanceTester.started).toBe(false)
            expect(fs.writeFile).toBeCalledTimes(1)
            expect(fs.writeFile).toBeCalledWith(expect.stringContaining('temp.html'), expect.anything(), expect.anything())
        })

        it('should stop and write generate CSV', async () => {
            PerformanceTester.startMonitoring('temp.csv')
            await PerformanceTester.stopAndGenerate('temp.html')
            expect(PerformanceTester.started).toBe(false)
            expect(PerformanceTester._csvWriter.writeRecords).toBeCalledTimes(1)
        })
    })
})
