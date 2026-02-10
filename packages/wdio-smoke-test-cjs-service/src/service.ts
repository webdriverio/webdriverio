import fs from 'node:fs'
import path from 'node:path'

export default class SmokeService {
    logFile: fs.WriteStream
    constructor () {
        this.logFile = fs.createWriteStream(path.resolve(__dirname, '..', '..', '..', 'tests', 'helpers', 'service-cjs.log'))
    }
    beforeSession () { this.logFile.write('beforeSession called\n') }
    before () { this.logFile.write('before called\n') }
    beforeSuite () { this.logFile.write('beforeSuite called\n') }
    beforeHook () { this.logFile.write('beforeHook called\n') }
    afterHook () { this.logFile.write('afterHook called\n') }
    beforeTest () { this.logFile.write('beforeTest called\n') }
    beforeCommand () { this.logFile.write('beforeCommand called\n') }
    afterCommand () { this.logFile.write('afterCommand called\n') }
    afterTest () { this.logFile.write('afterTest called\n') }
    afterSuite () { this.logFile.write('afterSuite called\n') }
    after () { this.logFile.write('after called\n') }
    afterSession () { this.logFile.write('afterSession called\n') }
    beforeAssertion () { this.logFile.write('beforeAssertion called\n') }
    afterAssertion () { this.logFile.write('afterAssertion called\n') }
}
