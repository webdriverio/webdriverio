import Auditor from '../src/auditor'

let auditor

beforeEach(() => {
    auditor = new Auditor({}, [])
})

test('getMainThreadWorkBreakdown', async () => {
    expect(await auditor.getMainThreadWorkBreakdown()).toMatchSnapshot()
})

test('getDiagnostics', async () => {
    expect(await auditor.getDiagnostics()).toMatchSnapshot()
})

test('getDiagnostics failing', async () => {
    auditor._audit = jest.fn().mockReturnValue(Promise.resolve({}))
    expect(await auditor.getDiagnostics()).toBe(null)
})

test('getMetrics', async () => {
    expect(await auditor.getMetrics()).toMatchSnapshot()
})

test('getPerformanceScore', async () => {
    expect(await auditor.getPerformanceScore()).toMatchSnapshot()
})

test('getPerformanceScore: returns null if any of the metrics is not available', async () => {
    auditor.getMetrics = jest.fn().mockReturnValue(Promise.resolve({}))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor.getMetrics = jest.fn().mockReturnValue(Promise.resolve({
        firstMeaningfulPaint: 1
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor.getMetrics = jest.fn().mockReturnValue(Promise.resolve({
        firstMeaningfulPaint: 1,
        firstCPUIdle: 2
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor.getMetrics = jest.fn().mockReturnValue(Promise.resolve({
        firstMeaningfulPaint: 1,
        firstCPUIdle: 2,
        firstInteractive: 3
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor.getMetrics = jest.fn().mockReturnValue(Promise.resolve({
        firstMeaningfulPaint: 1,
        firstCPUIdle: 2,
        firstInteractive: 3,
        speedIndex: 4
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor.getMetrics = jest.fn().mockReturnValue(Promise.resolve({
        firstMeaningfulPaint: 1,
        firstCPUIdle: 2,
        firstInteractive: 3,
        speedIndex: 4,
        estimatedInputLatency: 5
    }))
    expect(await auditor.getPerformanceScore()).toEqual(expect.any(Number))
})

test('updateCommands', () => {
    const browser = { addCommand: jest.fn() }
    auditor.updateCommands(browser)

    expect(browser.addCommand)
        .toBeCalledWith('getMainThreadWorkBreakdown', expect.any(Function))
    expect(browser.addCommand)
        .toBeCalledWith('getDiagnostics', expect.any(Function))
    expect(browser.addCommand)
        .toBeCalledWith('getMetrics', expect.any(Function))
    expect(browser.addCommand)
        .toBeCalledWith('getPerformanceScore', expect.any(Function))
})
