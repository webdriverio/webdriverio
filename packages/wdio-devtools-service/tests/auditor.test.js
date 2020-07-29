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
    auditor._audit = jest.fn().mockReturnValueOnce(Promise.resolve({}))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = jest.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = jest.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor.getMetrics = jest.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
        'largest-contentful-paint': {
            score: 1
        },
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = jest.fn().mockReturnValueOnce(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
        'largest-contentful-paint': {
            score: 1
        },
        'cumulative-layout-shift': {
            score: 1
        },
        'total-blocking-time': {
            score: 1
        }
    }))
    expect(await auditor.getPerformanceScore()).toBe(null)

    auditor._audit = jest.fn().mockReturnValue(Promise.resolve({
        'first-contentful-paint': {
            score: 1
        },
        'speed-index': {
            score: 1
        },
        'largest-contentful-paint': {
            score: 1
        },
        'cumulative-layout-shift': {
            score: 1
        },
        'total-blocking-time': {
            score: 1
        },
        'interactive': {
            score: 1
        },
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
