import { sep } from 'node:path'
import { AllureGroup, AllureTest, AllureStep } from 'allure-js-commons'
import { findLast } from './utils.js'

export class AllureReporterState {
    currentFile?: string
    runningUnits: Array<AllureGroup | AllureTest | AllureStep> = []

    get currentSuite(): AllureGroup | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureGroup) as AllureGroup | undefined
    }

    get currentTest(): AllureTest | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureTest) as AllureTest | undefined
    }

    get currentStep(): AllureStep | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureStep) as AllureStep | undefined
    }

    get currentAllureTestOrStep(): AllureTest | AllureStep | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureTest || unit instanceof AllureStep) as AllureTest | AllureStep | undefined
    }

    get currentPackageLabel(): string | undefined {
        if (!this.currentFile) {
            return undefined
        }

        return this.currentFile.replaceAll(sep, '.')
    }

    push(unit: AllureGroup | AllureTest | AllureStep) {
        this.runningUnits.push(unit)
    }

    pop(): AllureGroup | AllureTest | AllureStep | undefined {
        return this.runningUnits.pop()
    }
}
