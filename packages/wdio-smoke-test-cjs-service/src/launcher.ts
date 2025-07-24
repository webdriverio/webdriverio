import fs from 'node:fs'
import path from 'node:path'

export default class SmokeServiceLauncher {
    logFile: fs.WriteStream
    constructor () {
        this.logFile = fs.createWriteStream(path.resolve(__dirname, '..', '..', '..', 'tests', 'helpers', 'launcher.log'))
    }
    onPrepare () { this.logFile.write('onPrepare called\n') }
    onWorkerStart () { this.logFile.write('onWorkerStart called\n')}
    onWorkerEnd () { this.logFile.write('onWorkerEnd called\n')}
    onComplete () { this.logFile.write('onComplete called\n') }
}
