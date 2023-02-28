export const events = {
    addLabel: 'allure:addLabel',
    addLink: 'allure:addLink',
    addFeature: 'allure:addFeature',
    addStory: 'allure:addStory',
    addEpic: 'allure:addEpic',
    addSuite: 'allure:addSuite',
    addSubSuite: 'allure:addSubSuite',
    addParentSuite: 'allure:addParentSuite',
    addOwner: 'allure:addOwner',
    addSeverity: 'allure:addSeverity',
    addTag: 'allure:addTag',
    addIssue: 'allure:addIssue',
    addAllureId: 'allure:addAllureId',
    addTestId: 'allure:addTestId',
    addEnvironment: 'allure:addEnvironment',
    addDescription: 'allure:addDescription',
    addAttachment: 'allure:addAttachment',
    startStep: 'allure:startStep',
    endStep: 'allure:endStep',
    addStep: 'allure:addStep',
    addArgument: 'allure:addArgument',
    addAllureStep: 'allure:addAllureStep'
} as const

export const mochaEachHooks = ['"before each" hook', '"after each" hook'] as const
export const mochaAllHooks = ['"before all" hook', '"after all" hook'] as const
export const linkPlaceholder = '{}'
