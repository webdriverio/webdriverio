import { sep } from 'node:path'
import { AllureGroup, AllureTest, AllureStep, ExecutableItemWrapper } from 'allure-js-commons'
import { findLast } from './utils.js'
import type { AllureStepableUnit } from './types.js'

export class AllureReporterState {
    currentFile?: string
    runningUnits: Array<AllureGroup | AllureStepableUnit> = []
    stats: { test: number, hooks: number, suites: number } = { test: 0, hooks: 0, suites: 0 }

    get currentSuite(): AllureGroup | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureGroup) as AllureGroup | undefined
    }

    get currentTest(): AllureTest | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureTest) as AllureTest | undefined
    }

    get currentStep(): AllureStep | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureStep,) as AllureStep | undefined
    }

    get currentHook(): ExecutableItemWrapper | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof ExecutableItemWrapper) as ExecutableItemWrapper | undefined
    }

    get currentAllureStepableEntity(): AllureStepableUnit | undefined {
        return findLast(this.runningUnits, (unit) => unit instanceof AllureTest || unit instanceof AllureStep || unit instanceof ExecutableItemWrapper) as AllureTest | AllureStep | ExecutableItemWrapper | undefined
    }

    get currentPackageLabel(): string | undefined {
        if (!this.currentFile) {
            return undefined
        }

        return this.currentFile.replaceAll(sep, '.')
    }

    push(unit: AllureGroup | AllureStepableUnit) {
        if (unit instanceof AllureGroup) {
            this.stats.suites++
        } else if (unit instanceof AllureTest) {
            this.stats.test++
        } else {
            this.stats.hooks++
        }
        this.runningUnits.push(unit)
    }

    pop(): AllureGroup | AllureStepableUnit | undefined {
        return this.runningUnits.pop()
    }
}
