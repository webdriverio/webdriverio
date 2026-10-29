import type { HtmlReporterOptions, ReportData } from './types.js'
import nunjucks from 'nunjucks'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import { hookCountsAsFailure, type SuiteStats, type TestStats } from '@wdio/reporter'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import encode from './encode.js'
import { writeFile } from './files.js'
import logger from '@wdio/logger'
import url from 'node:url'

dayjs.extend(duration)

/** Windows: a file that another worker copies, or that an antivirus scans, is locked for a short time */
const BUSY_RETRIES = 20
const BUSY_RETRY_WAIT = 50
const BUSY_CODES = new Set(['EPERM', 'EBUSY', 'EACCES'])

/**
 * The workers of a run copy the same styles and font next to their reports, at the same time on parallel
 * workers: wait for a locked copy, then check the file
 */
async function copyAsset (from: string, to: string) {
    const content = await fsp.readFile(from)
    const copied = () => fsp.readFile(to).then((existing) => existing.equals(content), () => false)
    for (let tries = 0; ; tries++) {
        if (await copied()) {
            return
        }
        try {
            return await fsp.copyFile(from, to)
        } catch (err) {
            if (!BUSY_CODES.has((err as NodeJS.ErrnoException).code ?? '') || tries === BUSY_RETRIES) {
                // another worker can end its copy during the last try
                if (await copied()) {
                    return
                }
                throw err
            }
            await new Promise((resolve) => setTimeout(resolve, BUSY_RETRY_WAIT))
        }
    }
}

/**
 * The path of a file relative to the report, as a link: the browser reads `#`, `?`
 * and `%` in a file name as URL characters
 */
const linkTo = (outputDir: string, file: string) =>
    path.relative(outputDir, file).split(path.sep).map(encodeURIComponent).join('/')

/**
 * the escaping of the nunjucks autoescape, except `\` to `&#92;`
 * (`nunjucks.lib.escape` has no types)
 */
const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * The punctuation at the end of a URL in a text (`see https://a.com/b.`, `(https://a.com)`)
 * is not part of the URL. A closing parenthesis stays when the URL has its opening one
 * (`https://en.wikipedia.org/wiki/Foo_(bar)`).
 */
function splitTrailingPunctuation (text: string): [string, string] {
    let end = text.length
    while (end > 0) {
        const char = text[end - 1]
        const url = text.slice(0, end)
        const unbalanced = char === ')' && url.split('(').length < url.split(')').length
        if (!/[.,;:!?]/.test(char) && !unbalanced) {
            break
        }
        end--
    }
    return [text.slice(0, end), text.slice(end)]
}

class HtmlGenerator {
    private static LOG = logger('HtmlGenerator')
    /**
     * @returns false when a part of the report failed (the errors are logged)
     */
    static async htmlOutput(reportOptions: HtmlReporterOptions, reportData: ReportData): Promise<boolean> {

        HtmlGenerator.LOG.info('Html Generation started')
        let failed = false

        const specFileReferences: string[] = []
        try {
            const rootdirname = path.dirname(url.fileURLToPath(new URL('.', import.meta.url)))
            HtmlGenerator.LOG.info('Html Generation started in ' + rootdirname)
            const templateDir = rootdirname + '/templates/'
            const environment = nunjucks.configure([templateDir], { // set folders with templates
                autoescape: true,
            })

            environment.addGlobal('renderImage', function (screenshotFile: string) {
                // occurs when there is an image to render
                let relPath
                try {

                    if (!fs.existsSync(screenshotFile)) {
                        HtmlGenerator.LOG.error('renderImage: file does not exist: ' + screenshotFile)
                    }

                    relPath = linkTo(reportOptions.outputDir, screenshotFile)
                    if (reportOptions.linkScreenshots) {
                        HtmlGenerator.LOG.info('renderImage: Screenshot Relative Path: ' + relPath)
                        return relPath
                    }
                    return encode(path.resolve(screenshotFile))

                } catch(err) {
                    HtmlGenerator.LOG.error('renderImage: Error processing file: ' + relPath + ' ' + err)
                    return relPath
                }
            })
            environment.addGlobal('renderVideo', function (videoCaptureFile: string) {
                const relPath = linkTo(reportOptions.outputDir, videoCaptureFile)
                HtmlGenerator.LOG.debug('Video Relative Path: ' + relPath)
                return relPath
            })
            // @wdio/video-reporter makes webm videos by default
            environment.addGlobal('videoType', (videoCaptureFile: string) => {
                return path.extname(videoCaptureFile).toLowerCase() === '.webm' ? 'video/webm' : 'video/mp4'
            })
            environment.addGlobal('displaySpecFile', (suiteInfo:SuiteStats) => {
                // a filter can hide the root box: the first suite of the file keeps its own row
                if (suiteInfo?.file && suiteInfo.isRoot) {
                    return true
                }
                if (suiteInfo && suiteInfo.file) {
                    if (specFileReferences && !specFileReferences.includes(suiteInfo.file)) {
                        specFileReferences.push(suiteInfo.file)
                        return true
                    }
                }
                return false
            })

            environment.addGlobal('formatSpecFile', (suiteInfo:SuiteStats) => {
                // Display file path of spec
                // the root suite can name several spec files; remove the working folder only at the start of each
                const cwd = process.cwd()
                return suiteInfo.file.split(', ')
                    .map((file) => file.startsWith(cwd) ? file.slice(cwd.length) : file)
                    .join(', ')
            })

            environment.addGlobal('testStateColor', (testInfo:TestStats) => {
                if (testInfo.state === 'passed') {
                    return 'test-pass'
                } else if (testInfo.state === 'failed') {
                    return 'test-fail'
                } else if (testInfo.state === 'pending') {
                    return 'test-pending'
                } else if (testInfo.state === 'skipped') {
                    return 'test-skipped'
                }
            })

            environment.addGlobal('testStateClass', (testInfo:TestStats) => {
                if (testInfo.state === 'passed') {
                    return 'success'
                } else if (testInfo.state === 'failed') {
                    return 'error'
                } else if (testInfo.state === 'pending') {
                    return 'pending'
                } else if (testInfo.state === 'skipped') {
                    return 'skipped'
                }
            })
            environment.addGlobal('testStateIcon', (testInfo:TestStats) => {
                if (testInfo.state === 'passed') {
                    return '&#10004;'
                } else if (testInfo.state === 'failed') {
                    return '&#10006;'
                } else if (testInfo.state === 'pending') {
                    return '&#10004;'
                } else if (testInfo.state === 'skipped') {
                    return '&#10034;'
                }
            })
            environment.addGlobal('suiteStateColor', (suiteInfo:SuiteStats) => {
                if (suiteInfo.type.includes('feature')) {
                    return 'suite-feature'
                }
                if (!suiteInfo || !suiteInfo.tests) {
                    return 'suite-unknown'
                }
                // the last attempt of a retried test decides; the entry of a failed attempt keeps it
                const counts = (suite: SuiteStats) => (test: TestStats) => !test.retried || Boolean((suite as { retriedAttempt?: boolean }).retriedAttempt)
                const tests = Object.values(suiteInfo.tests).filter(counts(suiteInfo))
                let numTests = tests.length

                Object.values(tests).find((test: TestStats) => {
                    if (test.state === 'pending') {
                        --numTests
                    }
                })

                /**
                 * a failed test, a failed hook or a failed child suite: the "hide passing"
                 * filters must not hide a suite with a failure inside
                 */
                const hasFailure = (suite: SuiteStats): boolean =>
                    Object.values(suite.tests ?? []).some((test: TestStats) => test.state === 'failed' && counts(suite)(test)) ||
                    (suite.hooks ?? []).some(hookCountsAsFailure) ||
                    (suite.suites ?? []).some(hasFailure)
                if (hasFailure(suiteInfo)) {
                    return 'suite-fail'
                }

                const passes = Object.values(tests).filter((test: TestStats) => {
                    return test.state === 'passed'
                })
                if (passes.length === numTests && numTests > 0) {
                    return 'suite-pass'
                }

                //skipped is the lowest priority check
                const skipped = Object.values(tests).find((test: TestStats) => {
                    return test.state === 'skipped'
                })
                if (skipped !== undefined) {
                    return 'suite-pending'
                }

                return 'suite-unknown'
            })

            // the root suite of a worker is written for the commands of its hooks; the page shows only its tests and failed hooks
            environment.addGlobal('showSuite', (suite: SuiteStats) =>
                !suite.isRoot || Boolean(suite.tests?.length) || (suite.hooks ?? []).some((hook) => hook.error))

            environment.addGlobal('humanizeDuration', (duration:number) => {
                return dayjs.duration(duration, 'milliseconds').format('HH:mm:ss.SSS')
            })

            // the template writes the values into its script
            environment.addGlobal('ifCollapseTests', (_text:string) => {
                return Boolean(reportOptions.collapseTests)
            })

            environment.addGlobal('ifCollapseSuites', (_text:string) => {
                return Boolean(reportOptions.collapseSuites)
            })

            environment.addGlobal('formatLog', (text: unknown) => {
                const value = typeof text === 'string' ? text : String(text)
                if (!reportOptions.linkUrls) {
                    return value
                }
                // find the URLs in the text, then escape each part: a URL can have an apostrophe
                const linked = value.split(/(https?:\/\/[^\s<>"]+)/g).map((part, index) => {
                    if (index % 2 === 0) {
                        return escapeHtml(part)
                    }
                    const [url, after] = splitTrailingPunctuation(part)
                    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>${escapeHtml(after)}`
                }).join('')
                return new nunjucks.runtime.SafeString(linked)
            })

            environment.addGlobal('logClass', (text: unknown) => {
                if (typeof text === 'string' && text.includes('Test Iteration')) {
                    return 'test-iteration'
                }
                return 'log-output'

            })

            if (fs.existsSync(reportOptions.outputDir)) {
                try {
                    const html = nunjucks.render('report.html', reportData)
                    writeFile(reportData.reportFile, html)

                    const sortedSuites = reportData.suites.sort((suite1, suite2) => {
                        const first = dayjs.utc(suite1.start)
                        const second = dayjs.utc(suite2.start)
                        if (first.isAfter(second)) {
                            return 1
                        } else if (first.isBefore(second)) {
                            return -1
                        }
                        return 0
                    })

                    for (let i = 0; i < sortedSuites.length; i++) {
                        const suite = sortedSuites[i]

                        try {
                            const suiteHtml = await new Promise<string>((resolve, reject) => {
                                nunjucks.render('suite.html', { suite }, (err, result) => {
                                    if (err) {
                                        HtmlGenerator.LOG.error('Error rendering template:', err)
                                        reject(err)
                                    } else {
                                        resolve(result ?? '')
                                    }
                                })
                            })

                            await fsp.appendFile(reportData.reportFile, suiteHtml)
                            HtmlGenerator.LOG.info(`Appended suite: ${suite.title}`)
                        } catch (error) {
                            failed = true
                            HtmlGenerator.LOG.error('Error processing suite:', error)
                        }
                    }

                    if (fs.existsSync(reportOptions.outputDir)) {

                        const reportCss = rootdirname + '/css/report-styles.css'
                        const destCss = reportOptions.outputDir + '/report-styles.css'
                        await copyAsset(reportCss, destCss)

                        const cssFont = rootdirname + '/css/glyphicons-halflings-regular.woff'
                        const fontDest = reportOptions.outputDir + '/glyphicons-halflings-regular.woff'
                        await copyAsset(cssFont, fontDest)
                    }
                } catch (error) {
                    failed = true
                    HtmlGenerator.LOG.error('Html Generation failed: ' + error)
                }
            }
            HtmlGenerator.LOG.info('Html Generation Completed')
        } catch (ex) {
            failed = true
            HtmlGenerator.LOG.error('Html Generation processing ended in error: ' + ex)
        }
        return !failed
    }
}

export default HtmlGenerator