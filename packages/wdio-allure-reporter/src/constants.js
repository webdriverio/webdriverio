const PASSED = 'passed'
const FAILED = 'failed'
const BROKEN = 'broken'
const PENDING = 'pending'

const testStatuses = {
    PASSED,
    FAILED,
    BROKEN,
    PENDING
}

const stepStatuses = {
    PASSED,
    FAILED,
    BROKEN
}

const events = {
    addFeature: 'allure:addFeature',
    addStory: 'allure:addStory',
    addSeverity: 'allure:addSeverity',
    addIssue: 'allure:addIssue',
    addTestId: 'allure:addTestId',
    addEnvironment: 'allure:addEnvironment',
    addDescription: 'allure:addDescription',
    addAttachment: 'allure:addAttachment',
    addStep: 'allure:addStep',
    addArgument: 'allure:addArgument'
}

const mochaIgnoredHooks = ['"before all" hook', '"after all" hook', '"before each" hook', '"after each" hook']

export {testStatuses, stepStatuses, events, mochaIgnoredHooks}
