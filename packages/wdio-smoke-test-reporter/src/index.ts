import WDIOReporter from '@wdio/reporter'

export default class CustomSmokeTestReporter extends WDIOReporter {
    onRunnerStart () {
        this.write('onRunnerStart\n')
    }
    onBeforeCommand () {
        this.write('onBeforeCommand\n')
    }
    onAfterCommand () {
        this.write('onAfterCommand\n')
    }
    onScreenshot () {
        this.write('onScreenshot\n')
    }
    onSuiteStart () {
        this.write('onSuiteStart\n')
    }
    onHookStart () {
        this.write('onHookStart\n')
    }
    onHookEnd () {
        this.write('onHookEnd\n')
    }
    onTestStart () {
        this.write('onTestStart\n')
    }
    onTestPass () {
        this.write('onTestPass\n')
    }
    onTestFail () {
        this.write('onTestFail\n')
    }
    onTestSkip () {
        this.write('onTestSkip\n')
    }
    onTestEnd () {
        this.write('onTestEnd\n')
    }
    onSuiteEnd () {
        this.write('onSuiteEnd\n')
    }
    onRunnerEnd () {
        this.write('onRunnerEnd\n')
    }
}
