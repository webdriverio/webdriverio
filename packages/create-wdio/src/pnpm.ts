import fs from 'node:fs/promises'
import path from 'node:path'

import type { PACKAGE_MANAGER } from './constants.js'

const SKIP_BUILDS_FLAG = '--config.strict-dep-builds=false'
const WORKSPACE_FILE = 'pnpm-workspace.yaml'
const STRICT_DEP_BUILDS = /^strictDepBuilds\s*:/m
// pnpm 10 and older only warn about build scripts, and pnpm 9 rejects a pnpm-workspace.yaml without `packages`
const FIRST_STRICT_MAJOR = 11
const SKIP_BUILDS_MESSAGE = 'pnpm will skip the build scripts of the installed packages: WebdriverIO does not need them.'

const exists = (file: string) => fs.access(file).then(() => true, () => false)

function pnpmMajor () {
    const version = process.env.npm_config_user_agent?.match(/^pnpm\/(\d+)\./)
    return version ? Number(version[1]) : undefined
}

/**
 * pnpm 11 and later fail the install on blocked build scripts. No package that the wizard
 * installs needs its build script, so save `strictDepBuilds: false` in the project: a later
 * `pnpm install` needs it too. A pnpm workspace in a parent folder keeps its own settings.
 */
export async function savePnpmBuildSetting (root: string): Promise<{ result: 'written' | 'kept' | 'parent-workspace', file: string }> {
    const file = path.join(root, WORKSPACE_FILE)
    // pnpm uses the nearest pnpm-workspace.yaml
    if (!await exists(file)) {
        for (let dir = path.dirname(root); dir !== path.dirname(dir); dir = path.dirname(dir)) {
            const parentFile = path.join(dir, WORKSPACE_FILE)
            if (await exists(parentFile)) {
                return { result: 'parent-workspace', file: parentFile }
            }
        }
    }

    const content = await fs.readFile(file, 'utf8').catch(() => '')
    if (STRICT_DEP_BUILDS.test(content)) {
        return { result: 'kept', file }
    }
    const separator = content && !content.endsWith('\n') ? '\n' : ''
    await fs.writeFile(file, `${content}${separator}strictDepBuilds: false\n`)
    return { result: 'written', file }
}

/**
 * prepare an install in `root`
 * @returns the install flags of the package manager
 */
export async function preparePnpmInstall (pm: PACKAGE_MANAGER, root: string): Promise<string[]> {
    const major = pnpmMajor()
    if (pm !== 'pnpm' || (major !== undefined && major < FIRST_STRICT_MAJOR)) {
        return []
    }
    const { result, file } = await savePnpmBuildSetting(root)
    if (result === 'kept') {
        return []
    }
    if (result === 'written') {
        console.log(`${SKIP_BUILDS_MESSAGE} Saved \`strictDepBuilds: false\` in ${file}.`)
        return []
    }
    // pnpm treats a project that the parent does not list as its own workspace root
    console.log(
        `${SKIP_BUILDS_MESSAGE} A later \`pnpm install\` needs \`strictDepBuilds: false\`. ` +
        `If ${file} lists this project, add it there, else to ${path.join(root, WORKSPACE_FILE)}. ` +
        'You can also run `pnpm approve-builds`.'
    )
    return [SKIP_BUILDS_FLAG]
}
