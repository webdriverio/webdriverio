export const events = {
    startStep: 'allure:startStep',
    endStep: 'allure:endStep',
    addStep: 'allure:addStep',
} as const

export const eachHooks = ['"before each" hook', '"after each" hook'] as const
export const allHooks = ['"before all" hook', '"after all" hook'] as const
export const linkPlaceholder = '{}'
