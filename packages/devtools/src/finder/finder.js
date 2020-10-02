import path from 'path'
import { execSync } from 'child_process'

import { canAccess } from '@wdio/utils'

const DARWIN_LIST_APPS = 'system_profiler SPApplicationsDataType -json'

export const darwinGetAppPaths = (app) => {
    const apps = JSON.parse(execSync(DARWIN_LIST_APPS))
    const appPaths = apps.SPApplicationsDataType
        .filter(inst => inst.info && inst.info.startsWith(app))
        .map(inst => inst.path)

    return appPaths
}

export const darwinGetInstallations = (appPaths, suffixes) => {
    const installations = []
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
