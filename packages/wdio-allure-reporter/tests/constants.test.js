import {testStatuses, stepStatuses, events} from '../src/constants'

describe('Important constants', () => {

    it('should have correct step statuses', () => {
        expect(Object.values(stepStatuses)).toHaveLength(3)
        expect(stepStatuses.BROKEN).toEqual("broken")
        expect(stepStatuses.PASSED).toEqual("passed")
        expect(stepStatuses.FAILED).toEqual("failed")
    })

    it('should have correct step statuses', () => {
        expect(Object.values(testStatuses)).toHaveLength(4)
        expect(testStatuses.BROKEN).toEqual("broken")
        expect(testStatuses.PASSED).toEqual("passed")
        expect(testStatuses.FAILED).toEqual("failed")
        expect(testStatuses.PENDING).toEqual("pending")
    })

    it('should have correct step statuses', () => {
        expect(Object.values(events)).toHaveLength(10)
        expect(events.addSeverity).toEqual("allure:addSeverity")
        expect(events.addIssue).toEqual("allure:addIssue")
        expect(events.addTestId).toEqual("allure:addTestId")
        expect(events.addStep).toEqual("allure:addStep")
        expect(events.addAttachment).toEqual("allure:addAttachment")
        expect(events.addDescription).toEqual("allure:addDescription")
        expect(events.addEnvironment).toEqual("allure:addEnvironment")
        expect(events.addFeature).toEqual("allure:addFeature")
        expect(events.addStory).toEqual("allure:addStory")
        expect(events.addArgument).toEqual("allure:addArgument")
    })
})
