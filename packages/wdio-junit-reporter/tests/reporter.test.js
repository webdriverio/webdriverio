
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import libxml from 'libxmljs'

import JunitReporter from '../src'
import runnersFixture from './__fixtures__/runners.json'
import cucumberRunnerFixture from './__fixtures__/cucumberRunner.json'

let reporter = null
const outputDir = path.join(__dirname, 'tmp')
const baseReporter = {
    stats: runnersFixture,
    limit: (text) => text,
    epilogue: () => {}
}

describe('junit reporter', () => {
    describe('xml file', () => {
        beforeAll(() => {
            reporter = new JunitReporter(baseReporter, {}, { outputDir })
        })

        afterAll(() => {
            rimraf.sync(outputDir)
        })

        it('should generate a valid xml file', () => {
            reporter.onEnd()
        })

        it('should have generated two files', () => {
            fs.readdirSync(outputDir).should.have.length(2)
        })

        describe('content checks', () => {
            let xml1 = null
            let xml1Content = null
            let xml2 = null
            let xml2Content = null

            beforeAll(() => {
                [ xml1, xml2 ] = fs.readdirSync(outputDir)
                xml1Content = fs.readFileSync(path.join(outputDir, xml1), 'utf8')
                xml2Content = fs.readFileSync(path.join(outputDir, xml2), 'utf8')
            })

            it('should have correct file names', () => {
                xml1.should.be.equal('WDIO.xunit.phantomjs.0-0.xml')
                xml2.should.be.equal('WDIO.xunit.phantomjs.0-1.xml')
            })

            it('should be valid xml', () => {
                const xmlDoc1 = libxml.parseXml(xml1Content)
                const xmlDoc2 = libxml.parseXml(xml2Content)
                xmlDoc1.errors.should.have.length(0)
                xmlDoc2.errors.should.have.length(0)
            })

            it('should have content for skipped test', () => {
                xml2Content.should.containEql(
                // eslint-disable-next-line
`    <testcase classname="phantomjs.some_special_spec_title" name="skipped_test" time="1">`)
            })

            it('should have expected content', () => {
                xml1Content.should.containEql(
                    '<property name="file" value="/path/to/file.spec.js"/>'
                )
                xml2Content.should.containEql(
                    '<property name="file" value="/path/to/file2.spec.js"/>'
                )
                xml1Content.should.containEql(
                // eslint-disable-next-line
`    <testcase classname="phantomjs.some_other_foobar_test" name="that_is_a_test" time="1">
      <system-out>
        <![CDATA[
COMMAND: POST /path/to/command - "some payload"
]]>
      </system-out>
    </testcase>`)
                xml1Content.should.containEql(
                // eslint-disable-next-line
`    <properties>
      <property name="specId" value="12345"/>
      <property name="suiteName" value="some other foobar test"/>
      <property name="capabilities" value="phantomjs"/>
      <property name="file" value="/path/to/file.spec.js"/>
    </properties>`)

                xml1Content.should.containEql(
                // eslint-disable-next-line
`<system-err>
        <![CDATA[
some error stack
with new line
]]>
      </system-err>`
                )
            })
        })
    })

    describe('outputFileFormat as function', () => {
        let xml1 = null
        let xml2 = null

        beforeAll(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                outputFileFormat: (opts) => `some-file-${opts.cid}.xml`
            })
            reporter.onEnd()
        })

        afterAll(() => {
            rimraf.sync(outputDir)
        })

        it('should have used expected file name format', () => {
            [ xml1, xml2 ] = fs.readdirSync(outputDir)
            xml1.should.be.equal('some-file-0-0.xml')
            xml2.should.be.equal('some-file-0-1.xml')
        })
    })

    describe('outputFileFormat as single+multi', () => {
        let xml1 = null
        let xml2 = null
        let xml3 = null

        beforeAll(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                outputFileFormat: {
                    single: () => `all.xml`,
                    multi: (opts) => `some-file-${opts.cid}.xml`
                }
            })
            reporter.onEnd()
        })

        afterAll(() => {
            rimraf.sync(outputDir)
        })

        it('should have used expected file name format', () => {
            [ xml1, xml2, xml3 ] = fs.readdirSync(outputDir)
            xml1.should.be.equal('all.xml')
            xml2.should.be.equal('some-file-0-0.xml')
            xml3.should.be.equal('some-file-0-1.xml')
        })
    })

    describe('suiteNameFormat', () => {
        let xml2Content = null

        beforeAll(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                suiteNameFormat: /[^a-z0-9*]+/
            })
            reporter.onEnd()

            const files = fs.readdirSync(outputDir)
            xml2Content = fs.readFileSync(path.join(outputDir, files[1]), 'utf8')
        })

        afterAll(() => {
            rimraf.sync(outputDir)
        })

        it('should include ** in spec title', () => {
            xml2Content.should.containEql('<testsuite name="some_special_**_spec_title"')
        })
    })

    describe('packageName', () => {
        let xml1Content = null

        beforeAll(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                packageName: '____O.o____'
            })
            reporter.onEnd()

            const files = fs.readdirSync(outputDir)
            xml1Content = fs.readFileSync(path.join(outputDir, files[0]), 'utf8')
        })

        afterAll(() => {
            rimraf.sync(outputDir)
        })

        it('should have package name in classname', () => {
            xml1Content.should.containEql('classname="phantomjs-____O.o____.some_foobar_test"')
        })
    })

    describe('errorOptions', () => {
        let xml1Content = null

        beforeAll(() => {
            reporter = new JunitReporter(baseReporter, {}, {
                outputDir,
                errorOptions: {
                    error: 'message',
                    failure: 'message',
                    stacktrace: 'stack'
                }
            })
            reporter.onEnd()

            const files = fs.readdirSync(outputDir)
            xml1Content = fs.readFileSync(path.join(outputDir, files[0]), 'utf8')
        })

        afterAll(() => {
            rimraf.sync(outputDir)
        })

        it('should have package name in classname', () => {
            xml1Content.should.containEql(
                // eslint-disable-next-line
                `<failure message="some error message">
        <![CDATA[some error stack
with new line]]>
      </failure>
      <error message="some error message"/>`
            )
        })
    })

    describe('cucumber tests', () => {
        beforeAll(() => {
            const baseReporterCucumber = {
                stats: cucumberRunnerFixture,
                limit: (text) => text,
                epilogue: () => {}
            }

            reporter = new JunitReporter(baseReporterCucumber, {}, { outputDir })
        })

        afterAll(() => {
            rimraf.sync(outputDir)
        })

        it('should not crash when fed by cucumber', () => {
            reporter.onEnd()
            const files = fs.readdirSync(outputDir)
            files.should.have.lengthOf(1)
        })
    })
})
