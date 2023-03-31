import path from 'node:path'
import { execSync } from 'node:child_process'

import { canAccess } from '@wdio/utils'

const DARWIN_LIST_APPS = 'system_profiler SPApplicationsDataType -json'

interface ApplicationDataType {
    SPApplicationsDataType: {
        info: string
        path: string
    }[]
}

export const darwinGetAppPaths = (app: string) => {
    const apps: ApplicationDataType = JSON.parse(execSync(DARWIN_LIST_APPS).toString())
    const appPaths = apps.SPApplicationsDataType
        .filter(inst => inst.info && inst.info.startsWith(app))
        .map(inst => inst.path)

    return appPaths
}

export const darwinGetInstallations = (appPaths: string[], suffixes: string[]) => {
    const installations: string[] = []
    appPaths.forEach((inst) => {
        suffixes.forEach(suffix => {
            const execPath = path.join(inst.substring(0, inst.indexOf('.app') + 4).trim(), suffix)
            if (canAccess(execPath) && installations.indexOf(execPath) === -1) {
                installations.push(execPath)
            }
        })
    })
    return installations
}
