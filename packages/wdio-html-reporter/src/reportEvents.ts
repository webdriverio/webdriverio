/**
 * Sends logs, screenshots and videos from the tests to the HTML reporter.
 * Same API and events as `@rpii/wdio-report-events`, so both packages work
 * with this reporter.
 */
type Emit = (event: string, value: string) => boolean

function emit (event: string, value: string) {
    (process.emit as unknown as Emit).call(process, event, value)
}

export default class ReportEvents {
    logMessage(message: string) {
        emit('test:log', message)
        return this
    }

    logScreenshot(filename: string) {
        emit('test:screenshot', filename)
        return this
    }

    videoCapture(filename: string) {
        emit('test:video-capture', filename)
        return this
    }

    connectMessageEvent(fn: (message: string) => void) {
        process.on('test:log' as 'message', fn)
        return this
    }

    connectScreenshotEvent(fn: (filename: string) => void) {
        process.on('test:screenshot' as 'message', fn)
        return this
    }

    connectVideoCaptureEvent(fn: (filename: string) => void) {
        process.on('test:video-capture' as 'message', fn)
        return this
    }
}
