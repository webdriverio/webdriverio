
declare namespace AllureReporter {
    type StepStatus = 'passed' | 'failed' | 'broken' | 'canceled' | 'skipped'

    // ... AllureReporter commands ...
}

declare module "@wdio/allure-reporter" {
    export default AllureReporter
}
