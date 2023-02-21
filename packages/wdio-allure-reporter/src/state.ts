import { AllureGroup, AllureTest, AllureStep } from 'allure-js-commons'
import { findLast } from './utils.js'

export class AllureReporterState {
    _runningUnits: Array<AllureGroup | AllureTest | AllureStep> = []

    get currentSuite(): AllureGroup | undefined {
        return findLast(this._runningUnits, (unit) => unit instanceof AllureGroup) as AllureGroup | undefined
    }

    get currentTest(): AllureTest | undefined {
        return findLast(this._runningUnits, (unit) => unit instanceof AllureTest) as AllureTest | undefined
    }

    get currentStep(): AllureStep | undefined {
        return findLast(this._runningUnits, (unit) => unit instanceof AllureStep) as AllureStep | undefined
    }

    get currentAllureTestOrStep(): AllureTest | AllureStep | undefined {
        return findLast(this._runningUnits, (unit) => unit instanceof AllureTest || unit instanceof AllureStep) as AllureTest | AllureStep | undefined
    }

    push(unit: AllureGroup | AllureTest | AllureStep) {
        this._runningUnits.push(unit)
    }

    pop(): AllureGroup | AllureTest | AllureStep | undefined {
        return this._runningUnits.pop()
    }
}
