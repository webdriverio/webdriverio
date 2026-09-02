import WDIOReporter from '@wdio/reporter'
import type {
    TestStats,
    AfterCommandArgs
} from '@wdio/reporter'

import { writeTraceData } from './traceWriter.js'

export default class TraceViewerReporter extends WDIOReporter {
    private traceData: any[] = []

    constructor(options: any) {
        super(options)
    }

    onTestStart(test: TestStats) {
        this.traceData.push({
            type: 'test:start',
            name: test.title,
            start: Date.now()
        })
    }

    onTestPass(test: TestStats) {
        this.traceData.push({
            type: 'test:pass',
            name: test.title,
            end: Date.now()
        })
    }

    onTestFail(test: TestStats) {
        this.traceData.push({
            type: 'test:fail',
            name: test.title,
            error: test.error,
            end: Date.now()
        })
    }

    onTestSkip(test: TestStats) {
        this.traceData.push({
            type: 'test:skip',
            name: test.title,
            end: Date.now()
        })
    }

    onAfterCommand(command: AfterCommandArgs) {
        const isWebDriverCommand =
        command.endpoint?.startsWith('/') && typeof command.method === 'string'

        if (isWebDriverCommand) {
            const cmd: any = command

            this.traceData.push({
                type: 'http',
                method: command.method,
                endpoint: command.endpoint,
                requestBody: cmd.body ?? null,
                responseBody: cmd.result ?? null,
                sessionId: command.sessionId ?? null,
                timestamp: Date.now(),
                duration: cmd._duration ?? null
            })
        }
    }

    onRunnerEnd() {
        writeTraceData(this.traceData)
    }
}
