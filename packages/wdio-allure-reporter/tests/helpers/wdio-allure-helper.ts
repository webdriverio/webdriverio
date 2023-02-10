import fs from 'node:fs'
import path from 'node:path'
import rimraf from 'rimraf'
import { load } from 'cheerio'
import { AllureGroup, AllureTest, AllureStep } from 'allure-js-commons'
import AllureReporter from '../../src/reporter.js'

export function getResults (resultsDir: any) {
    return getResultFiles(resultsDir, 'xml').map((file) => {
        const fileContent = fs.readFileSync(path.join(resultsDir, file), 'utf-8')
        return load(fileContent)
    })
}

export function getResultFiles (resultsDir: any, patterns: any) {
    if (!Array.isArray(patterns)) {
        patterns = [patterns]
    }
    return fs.readdirSync(resultsDir).filter((file) =>
        patterns.some((pattern: any) => file.endsWith('.' + pattern)))
}

export function clean (resultsDir: any) {
    return rimraf.sync(resultsDir)
}

export function getSuitesFromReporter(reporter: AllureReporter): AllureGroup[] {
    return reporter._runningUnits.filter(unit => unit instanceof AllureGroup) as AllureGroup[]
}

export function getTestsFromReporter(reporter: AllureReporter): AllureTest[] {
    return reporter._runningUnits.filter(unit => unit instanceof AllureTest) as AllureTest[]
}

export function getStepsFromReporter(reporter: AllureReporter): AllureStep[] {
    return reporter._runningUnits.filter(unit => unit instanceof AllureStep) as AllureStep[]
}
