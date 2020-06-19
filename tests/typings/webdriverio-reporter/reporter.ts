// reporter
import WDIOReporter from '@wdio/reporter';

const suite: WDIOReporter.Suite = {
    duration: 0,
    fullTitle: '',
    title: '',
    type: '',
    uid: ''
}

const hook: WDIOReporter.Hook = {
    duration: 0,
    parent: '',
    title: '',
    uid: ''
}

const error: WDIOReporter.Error = {
    message: '',
    stack: '',
    type: 'Error',
    expected: undefined,
    actual: undefined
}

const test: WDIOReporter.Test = {
    _duration: 0,
    title: '',
    fullTitle: '',
    state: 'failed',
    errors: [ error ],
    error: error,
}

const options: WDIOReporter.Options = {
    configFile: '',
    logFile: '',
    logLevel: ''
}

const beforeCommand: WDIOReporter.BeforeCommand = {
    method: 'GET',
    endpoint: '/wd',
    body: {},
    sessionId: 'foo',
    cid: '0-0',
}

const afterCommand: WDIOReporter.AfterCommand = {
    method: 'GET',
    endpoint: '/wd',
    body: {},
    result: {},
    sessionId: 'foo',
    cid: '0-0',
}

class CustomReporter extends WDIOReporter {
    constructor(options: WDIOReporter.Options) {
        super(options)
    }

    onRunnerStart(runner: any) {
      // Do things
    }

    onRunnerEnd(runner: any) {
      // Do things
    }
}

export default {}
