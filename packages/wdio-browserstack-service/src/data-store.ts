import path from 'node:path'
import fs from 'node:fs'

import { BStackLogger } from './bstackLogger.js'

const workersDataDirPath = path.join(process.cwd(), 'logs', 'worker_data')

export function getDataFromWorkers(){
    const workersData: Record<string, object>[] = []

    if (!fs.existsSync(workersDataDirPath)) {
        return workersData
    }

    const files = fs.readdirSync(workersDataDirPath)
    files.forEach((file) => {
        BStackLogger.debug('Reading worker file ' + file)
        const filePath = path.join(workersDataDirPath, file)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const workerData = JSON.parse(fileContent)
        workersData.push(workerData)
    })

    // Remove worker data after all reading
    removeWorkersDataDir()

    return workersData
}

export function saveWorkerData(data: Record<string, any>) {
    const filePath = path.join(workersDataDirPath, 'worker-data-' + process.pid + '.json')

    try {
        createWorkersDataDir()
        fs.writeFileSync(filePath, JSON.stringify(data))
    } catch (e) {
        BStackLogger.debug('Exception in saving worker data: ' + e)
    }
}

export function removeWorkersDataDir(): boolean {
    fs.rmSync(workersDataDirPath, { recursive: true, force: true })
    return true
}

function createWorkersDataDir() {
    if (!fs.existsSync(workersDataDirPath)) {
        fs.mkdirSync(workersDataDirPath, { recursive: true })
    }
    return true
}
