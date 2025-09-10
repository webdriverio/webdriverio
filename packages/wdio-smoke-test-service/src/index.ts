import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default class SmokeService {
    logFile: fs.WriteStream
    constructor () {
        this.logFile = fs.createWriteStream(path.resolve(__dirname, '..', '..', '..', 'tests', 'helpers', 'service.log'))
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

class SmokeServiceLauncher {
    logFile: fs.WriteStream
    constructor () {
        this.logFile = fs.createWriteStream(path.resolve(__dirname, '..', '..', '..', 'tests', 'helpers', 'launcher.log'))
    }
    onPrepare () { this.logFile.write('onPrepare called\n') }
    onWorkerStart () { this.logFile.write('onWorkerStart called\n')}
    onWorkerEnd () { this.logFile.write('onWorkerEnd called\n')}
    onComplete () { this.logFile.write('onComplete called\n') }
}

export const launcher = SmokeServiceLauncher
