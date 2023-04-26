import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import rimraf from 'rimraf'
import type { Attachment, TestResult } from 'allure-js-commons'
import { AllureGroup, AllureTest, AllureStep } from 'allure-js-commons'
// eslint-disable-next-line
import AllureReporter from '../../src/reporter.js'

export function parseEnvInfo (info: string): Record<string, any> {
    return info.split(os.EOL).reduce((acc, line) => {
        const [key, value] = line.split(' = ')

        return Object.assign(acc, {
            [key]: value,
        })
    }, {})
}

export function getAllAttachments(test: TestResult): Attachment[] {
    let attachments: Attachment[] = []

    if (test.attachments) {
        attachments = attachments.concat(test.attachments)
    }

    if (test.steps) {
        attachments = attachments.concat(test.steps.flatMap(step => getAllAttachments(step as TestResult)))
    }

    return attachments
}

export function getResults (resultsDir: any) {
    const results = getResultFiles(resultsDir, [/-result\.json$/]).map((file) => {
        const fileContent = fs.readFileSync(path.join(resultsDir, file), 'utf-8')

        return JSON.parse(fileContent)
    })
    const containers = getResultFiles(resultsDir, [/-container\.json$/]).map((file) => {
        const fileContent = fs.readFileSync(path.join(resultsDir, file), 'utf-8')

        return JSON.parse(fileContent)
    })
    const environmentInfo = getResultFiles(resultsDir, [/environment\.properties/]).reduce((acc, file) => {
        const fileContent = fs.readFileSync(path.join(resultsDir, file), 'utf-8')

        return Object.assign(acc, parseEnvInfo(fileContent))
    }, {})
    const attachments = results.flatMap((test) => getAllAttachments(test))

    return {
        attachments,
        results,
        containers,
        environmentInfo,
    }
}

export function getResultFiles (resultsDir: any, patterns: RegExp[]) {
    if (!Array.isArray(patterns)) {
        patterns = [patterns]
    }

    return fs.readdirSync(resultsDir).filter((file) => patterns.some((pattern) => pattern.test(file)))
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

export function mapBy<T>(arr: T[], key: keyof T): Record<any, T[]> {
    return arr.reduce<Record<any, T[]>>((acc, item) => {
        const value = item[key]

        if (!acc[value]) {
            Object.assign(acc, {
                [String(value)]: []
            })
        }

        acc[value].push(item)

        return acc
    }, {})
}
