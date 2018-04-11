import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'

import junit from 'junit-report-builder'
import get from 'lodash.get'

import WDIOReporter from 'wdio-reporter'
import logger from 'wdio-logger'

const log = logger('wdio-junit-reporter')

class JunitReporter extends WDIOReporter {
    constructor (baseReporter, config, options = {}) {
        super()

        this.baseReporter = baseReporter
        this.config = config
        this.options = options
        this.suiteNameRegEx = this.options.suiteNameFormat instanceof RegExp
            ? this.options.suiteNameFormat
            : /[^a-zA-Z0-9]+/

        this.on('end', ::this.onEnd)
    }

    onRunnerEnd () {
        const outputIsFunction = typeof this.options.outputFileFormat === 'function'
        if (outputIsFunction) {
            // backward compatibility
            this.options.outputFileFormat = {
                multi: this.options.outputFileFormat
            }
        }
        const noFileOutputDefined = !this.options.outputFileFormat
        const hasSingleFileOutput = get(this.options, 'outputFileFormat.single')
        const hasMultiFileOutput = get(this.options, 'outputFileFormat.multi')
        if (noFileOutputDefined || hasMultiFileOutput) {
            this.onMultiFileOutput()
        }
        if (hasSingleFileOutput) {
            this.onSingleFileOutput()
        }
        const { epilogue } = this.baseReporter
        epilogue.call(this.baseReporter)
    }

    onSingleFileOutput () {
        const xml = this.prepareXml(this.baseReporter.stats.runners)
        let filename = `WDIO.xunit.all.xml` // default
        if (typeof get(this.options, 'outputFileFormat.single') === 'function') {
            filename = this.options.outputFileFormat.single({
                config: this.config
            })
        }
        this.write(filename, xml)
    }

    onMultiFileOutput () {
        for (let cid of Object.keys(this.baseReporter.stats.runners)) {
            const capabilities = this.baseReporter.stats.runners[cid]
            const singleRunner = {}
            singleRunner[cid] = capabilities
            const xml = this.prepareXml(singleRunner)
            let filename = `WDIO.xunit.${capabilities.sanitizedCapabilities}.${cid}.xml` // default
            if (typeof get(this.options, 'outputFileFormat.multi') === 'function') {
                filename = this.options.outputFileFormat.multi({
                    capabilities: capabilities.sanitizedCapabilities,
                    cid: cid,
                    config: this.config
                })
            }
            this.write(filename, xml)
        }
    }

    prepareName (name = 'Skipped test') {
        return name.split(this.suiteNameRegEx).filter(
            (item) => item && item.length
        ).join('_')
    }

    prepareXml (runners) {
        const builder = junit.newBuilder()
        for (const key of Object.keys(runners)) {
            const capabilities = runners[key]
            const packageName = this.options.packageName
                ? `${capabilities.sanitizedCapabilities}-${this.options.packageName}`
                : capabilities.sanitizedCapabilities

            for (let specId of Object.keys(capabilities.specs)) {
                const spec = capabilities.specs[specId]

                for (let suiteKey of Object.keys(spec.suites)) {
                    /**
                     * ignore root before all
                     */
                    /* istanbul ignore if  */
                    if (suiteKey.match(/^"before all"/)) {
                        continue
                    }

                    const suite = spec.suites[suiteKey]
                    const suiteName = this.prepareName(suite.title)
                    const testSuite = builder.testSuite()
                        .name(suiteName)
                        .timestamp(suite.start)
                        .time(suite.duration / 1000)
                        .property('specId', specId)
                        .property('suiteName', suite.title)
                        .property('capabilities', capabilities.sanitizedCapabilities)
                        .property('file', spec.files[0].replace(process.cwd(), '.'))

                    for (let testKey of Object.keys(suite.tests)) {
                        if (testKey !== 'undefined') { // fix cucumber hooks crashing reporter
                            const test = suite.tests[testKey]
                            const testName = this.prepareName(test.title)
                            const testCase = testSuite.testCase()
                                .className(`${packageName}.${suiteName}`)
                                .name(testName)
                                .time(test.duration / 1000)

                            if (test.state === 'pending') {
                                testCase.skipped()
                            }

                            if (test.error) {
                                const errorOptions = this.options.errorOptions
                                if (errorOptions) {
                                    for (const key of Object.keys(errorOptions)) {
                                        testCase[key](test.error[errorOptions[key]])
                                    }
                                } else {
                                    // default
                                    testCase.error(test.error.message)
                                }
                                testCase.standardError(`\n${test.error.stack}\n`)
                            }

                            const output = this.getStandardOutput(test)
                            if (output) testCase.standardOutput(`\n${output}\n`)
                        }
                    }
                }
            }
        }
        return builder.build()
    }

    getStandardOutput (test) {
        /* istanbul ignore if  */
        if (this.options.writeStandardOutput === false) {
            return ''
        }
        let standardOutput = []
        test.output.forEach((data) => {
            switch (data.type) {
            case 'command':
                standardOutput.push(
                    `COMMAND: ${data.payload.method.toUpperCase()} ` +
                    `${data.payload.uri.href} - ${this.format(data.payload.data)}`
                )
                break
            case 'result':
                standardOutput.push(`RESULT: ${this.format(data.payload.body)}`)
                break
            }
        })
        return standardOutput.length ? standardOutput.join('\n') : ''
    }

    write (filename, xml) {
        /* istanbul ignore if  */
        if (!this.options || typeof this.options.outputDir !== 'string') {
            return log.info(`Cannot write xunit report: empty or invalid 'outputDir'.`)
        }

        try {
            const dir = path.resolve(this.options.outputDir)
            const filepath = path.join(dir, filename)
            mkdirp.sync(dir)
            fs.writeFileSync(filepath, xml)
            log.info(`Wrote xunit report "${filename}" to [${this.options.outputDir}].`)
        } catch (e) {
            /* istanbul ignore next */
            log.info(`Failed to write xunit report "${filename}"
             to [${this.options.outputDir}]. Error: ${e}`)
        }
    }

    format (val) {
        return JSON.stringify(this.baseReporter.limit(val))
    }
}

export default JunitReporter
