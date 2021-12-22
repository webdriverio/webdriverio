import type { Status } from './types'

export const PASSED = 'passed'
export const FAILED = 'failed'
export const BROKEN = 'broken'
export const PENDING = 'pending'
export const CANCELED = 'canceled'
export const SKIPPED = 'skipped'

const testStatuses: Record<string, Status> = {
    PASSED,
    FAILED,
    BROKEN,
    PENDING
} as const
const stepStatuses: Record<string, Status> = {
    PASSED,
    FAILED,
    BROKEN,
    CANCELED,
    SKIPPED
} as const

const events = {
    addLabel: 'allure:addLabel',
    addFeature: 'allure:addFeature',
    addStory: 'allure:addStory',
    addSeverity: 'allure:addSeverity',
    addIssue: 'allure:addIssue',
    addTestId: 'allure:addTestId',
    addEnvironment: 'allure:addEnvironment',
    addDescription: 'allure:addDescription',
    addAttachment: 'allure:addAttachment',
    startStep: 'allure:startStep',
    endStep: 'allure:endStep',
    addStep: 'allure:addStep',
    addArgument: 'allure:addArgument'
} as const

const mochaEachHooks = ['"before each" hook', '"after each" hook'] as const
const mochaAllHooks = ['"before all" hook', '"after all" hook'] as const
const linkPlaceholder = '{}'

export { testStatuses, stepStatuses, events, mochaEachHooks, mochaAllHooks, linkPlaceholder }
