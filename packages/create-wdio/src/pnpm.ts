import fs from 'node:fs/promises'
import path from 'node:path'

import type { PACKAGE_MANAGER } from './constants.js'

export const PNPM_SKIP_BUILDS_FLAG = '--config.strict-dep-builds=false'

const WORKSPACE_FILE = 'pnpm-workspace.yaml'
const SETTING = /^strictDepBuilds\s*:/m

const exists = (file: string) => fs.access(file).then(() => true, () => false)

/**
 * pnpm 11 and later fail the install on blocked build scripts. No package that the wizard
 * installs needs its build script, so save `strictDepBuilds: false` in the project: a later
 * `pnpm install` needs it too. A pnpm workspace in a parent folder keeps its own settings.
 */
export async function savePnpmBuildSetting (root: string): Promise<'written' | 'kept' | 'parent-workspace'> {
    for (let dir = path.dirname(root); dir !== path.dirname(dir); dir = path.dirname(dir)) {
        if (await exists(path.join(dir, WORKSPACE_FILE))) {
            return 'parent-workspace'
        }
    }

    const file = path.join(root, WORKSPACE_FILE)
    const content = await fs.readFile(file, 'utf8').catch(() => '')
    if (SETTING.test(content)) {
        return 'kept'
    }
    const separator = content && !content.endsWith('\n') ? '\n' : ''
    await fs.writeFile(file, `${content}${separator}strictDepBuilds: false\n`)
    return 'written'
}

/**
 * prepare an install in `root`
 * @returns the install flags of the package manager
 */
export async function preparePnpmInstall (pm: PACKAGE_MANAGER, root: string): Promise<string[]> {
    if (pm !== 'pnpm') {
        return []
    }
    const setting = await savePnpmBuildSetting(root)
    if (setting === 'kept') {
        return []
    }
    console.log('pnpm will skip the build scripts of the installed packages: WebdriverIO does not need them.')
    return setting === 'parent-workspace' ? [PNPM_SKIP_BUILDS_FLAG] : []
}
