declare namespace AllureReporter {
    type StepStatus = 'passed' | 'failed' | 'broken' | 'canceled' | 'skipped'

    function addFeature(
        featureName: string
    ): void;
    function addLabel(
        name: string,
        value: string
    ): void;
    function addSeverity(
        severity: string
    ): void;
    function addIssue(
        issue: string
    ): void;
    function addTestId(
        testId: string
    ): void;
    function addStory(
        storyName: string
    ): void;
    function addEnvironment(
        name: string,
        value: string
    ): void;
    function addDescription(
        description: string,
        descriptionType: string
    ): void;
    function addAttachment(
        name: string,
        content: any,
        mimeType?: string
    ): void;
    function startStep(
        title: string
    ): void;
    function endStep(
        status?: StepStatus
    ): void;
    function addStep(
        title: string,
        attachmentObject?: object,
        status?: string
    ): void;
    function addArgument(
        name: string,
        value: string
    ): void;
}

declare module "@wdio/allure-reporter" {
    export default AllureReporter
}
