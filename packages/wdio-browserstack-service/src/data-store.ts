import path from 'node:path'
import fs from 'node:fs'
import * as util from 'node:util'

import { BStackLogger } from './bstackLogger.js'

class DataStore {
    static workersDataDirPath = path.join(process.cwd(), 'logs', 'worker_data')

    public static getDataFromWorkers(){
        const workersData: Record<string, object>[] = []

        if (!fs.existsSync(this.workersDataDirPath)) {
            return workersData
        }

        const files = fs.readdirSync(this.workersDataDirPath)
        files.forEach((file) => {
            BStackLogger.debug('reading file ' + file)
            const filePath = path.join(this.workersDataDirPath, file)
            const fileContent = fs.readFileSync(filePath, 'utf8')
            const workerData = JSON.parse(fileContent)
            workersData.push(workerData)
        })

        // Remove worker data after all reading
        this.removeWorkersDataDir()

        return workersData
    }

    public static saveWorkerData(data: Record<string, object>) {
        // TODO: Remove after debugging
        BStackLogger.debug(`data from worker is ${util.inspect(data, { depth: 6 })}`)

        const filePath = path.join(this.workersDataDirPath, 'worker-data-' + process.pid + '.json')

        this.createWorkersDataDir()
        fs.writeFileSync(filePath, JSON.stringify(data))
    }

    private static removeWorkersDataDir(): boolean {
        fs.rmSync(this.workersDataDirPath, { recursive: true, force: true })
        return true
    }

    private static createWorkersDataDir() {
        if (!fs.existsSync(this.workersDataDirPath)) {
            fs.mkdirSync(this.workersDataDirPath, { recursive: true })
        }
        return true
    }
}

export default DataStore
