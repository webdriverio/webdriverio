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

    onAfterCommand(command: AfterCommandArgs) {
        this.traceData.push({
            type: 'command',
            command,
            timestamp: Date.now()
        })
    }

    onRunnerEnd() {
        writeTraceData(this.traceData)
    }
}
