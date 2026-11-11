import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { generate } from 'multiple-cucumber-html-reporter'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const resultsDir = path.join(__dirname, 'results')
const jsonFolder = path.join(resultsDir, 'json')
const reportPath = path.join(resultsDir, 'report')
const featureFile = path.join(__dirname, 'cucumberjs-json.feature')

interface Step { keyword: string, name?: string, line?: number | null, hidden?: boolean, result: { status: string }, embeddings?: { mime_type: string }[] }
interface Scenario { id: string, name: string, line?: number, steps: Step[] }
interface Feature { id: string, name: string, uri: string, line?: number, metadata?: { browser?: { name?: string, version?: string } }, elements: Scenario[] }
/** the parts of the `enriched-output.json` of multiple-cucumber-html-reporter that the check reads */
interface ReportFeature extends Omit<Feature, 'elements'> {
    scenarios: { total: number, passed: number, failed: number }
    elements: { steps: (Step & { image?: string[] })[] }[]
}

/**
 * Real-browser check of `@wdio/cucumberjs-json-reporter` (not in CI, run it when
 * you work on the reporter): `pnpm run test:e2e:cucumberjs-json-reporter`. The run
 * fails in `onComplete` when the JSON file, or the HTML report that
 * multiple-cucumber-html-reporter makes from it (the README example), does not
 * have the expected content.
 */
export const config: WebdriverIO.Config = {
    specs: [featureFile],
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }],
    logLevel: 'info',
    framework: 'cucumber',
    outputDir: resultsDir,
    reporters: ['spec', ['cucumberjs-json', { jsonFolder, language: 'en' }]],
    cucumberOpts: {
        require: [path.join(__dirname, 'steps.ts')],
        timeout: 60000
    },

    /**
     * the launcher already writes its log into `resultsDir`
     */
    onPrepare () {
        fs.rmSync(jsonFolder, { recursive: true, force: true })
        fs.rmSync(reportPath, { recursive: true, force: true })
    },

    async onComplete () {
        const errors: string[] = []
        const check = (ok: unknown, message: string) => {
            if (!ok) {
                errors.push(message)
            }
        }

        const files = fs.existsSync(jsonFolder) ? fs.readdirSync(jsonFolder).filter((file) => file.endsWith('.json')) : []
        check(files.length === 1, `expected 1 JSON file in ${jsonFolder}, found ${files.length}`)
        const features: Feature[] = files.length ? JSON.parse(fs.readFileSync(path.join(jsonFolder, files[0]), 'utf-8')) : []
        const feature = features[0]
        check(feature?.name === 'Cucumber JSON reporter e2e', `feature name: ${feature?.name}`)
        check(feature?.line === 1, `feature line: ${feature?.line}`)
        check(feature?.metadata?.browser?.name === 'chrome', `metadata browser name: ${feature?.metadata?.browser?.name}`)
        check(/^\d+/.test(feature?.metadata?.browser?.version ?? ''), `metadata browser version: ${feature?.metadata?.browser?.version}`)

        const [open, attach] = feature?.elements ?? []
        check(open?.id === `${feature?.id};open-the-guinea-pig-page`, `scenario id: ${open?.id}`)
        check(open?.line === 3, `scenario line: ${open?.line}`)
        const steps = open?.steps.filter((step) => !step.hidden) ?? []
        check(
            JSON.stringify(steps.map((step) => [step.keyword.trim(), step.name, step.line, step.result.status])) === JSON.stringify([
                ['Given', 'I open the guinea pig page', 4, 'passed'],
                ['When', 'I click the main title', 5, 'passed'],
                ['Then', 'the page title is "WebdriverJS Testpage"', 6, 'passed'],
                ['But', 'the second page link is shown', 7, 'passed']
            ]),
            `steps of the first scenario: ${JSON.stringify(steps.map((step) => [step.keyword, step.name, step.line, step.result.status]))}`
        )
        check(
            open?.steps.filter((step) => step.hidden).every((hook) => hook.name === undefined && hook.line === undefined),
            'hooks must be hidden, without name and line'
        )

        const [star, screenshot] = attach?.steps.filter((step) => !step.hidden) ?? []
        check(star?.keyword.trim() === '*' && star?.name === 'I open the guinea pig page' && star?.line === 10, `* step: ${JSON.stringify(star)}`)
        check(screenshot?.embeddings?.some((embedding) => embedding.mime_type === 'image/png'), 'no image/png embedding on "I attach a screenshot"')

        // the README example: an HTML report from the JSON files
        await generate({ jsonDir: jsonFolder, reportPath, saveCollectedJSON: true })
        const enrichedFile = path.join(reportPath, 'enriched-output.json')
        const report: { features: ReportFeature[] } = fs.existsSync(enrichedFile) ? JSON.parse(fs.readFileSync(enrichedFile, 'utf-8')) : { features: [] }
        const [reportFeature] = report.features
        check(report.features.length === 1 && reportFeature.name === feature?.name, `HTML report features: ${report.features.map((entry) => entry.name).join(', ')}`)
        check(
            reportFeature?.scenarios.total === 2 && reportFeature.scenarios.passed === 2 && reportFeature.scenarios.failed === 0,
            `HTML report scenarios: ${JSON.stringify(reportFeature?.scenarios)}`
        )
        // the report moves an image embedding into `step.image`
        check(
            reportFeature?.elements[1]?.steps.some((step) => step.image?.some((image) => image.startsWith('data:image/png;base64,iVBOR'))),
            'no screenshot on "I attach a screenshot" in the HTML report'
        )
        const indexFile = path.join(reportPath, 'index.html')
        check(fs.existsSync(indexFile) && fs.readFileSync(indexFile, 'utf-8').includes('Cucumber JSON reporter e2e'), `no feature in ${indexFile}`)
        const featurePages = fs.existsSync(path.join(reportPath, 'features')) ? fs.readdirSync(path.join(reportPath, 'features')) : []
        check(
            featurePages.length === 1 && fs.readFileSync(path.join(reportPath, 'features', featurePages[0]), 'utf-8').includes('data:image/png;base64,iVBOR'),
            `no screenshot in the feature page of the HTML report: ${featurePages.join(', ')}`
        )

        if (errors.length) {
            console.error(`Cucumber JSON reporter e2e check failed:\n  - ${errors.join('\n  - ')}`)
            throw new Error('Cucumber JSON reporter e2e check failed')
        }
        console.log(`Cucumber JSON reporter e2e check passed: ${files[0]}, HTML report ${indexFile}`)
    }
}
