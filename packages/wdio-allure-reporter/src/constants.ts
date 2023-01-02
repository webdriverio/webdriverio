import type { Status } from './types.js'

export const PASSED = 'passed'
export const FAILED = 'failed'
export const BROKEN = 'broken'
export const PENDING = 'pending'
export const CANCELED = 'canceled'
export const SKIPPED = 'skipped'

export const testStatuses: Record<string, Status> = {
    PASSED,
    FAILED,
    BROKEN,
    PENDING
} as const
export const stepStatuses: Record<string, Status> = {
    PASSED,
    FAILED,
    BROKEN,
    CANCELED,
    SKIPPED
} as const

export const events = {
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

export const mochaEachHooks = ['"before each" hook', '"after each" hook'] as const
export const mochaAllHooks = ['"before all" hook', '"after all" hook'] as const
export const linkPlaceholder = '{}'
