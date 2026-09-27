import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Absolute path to the monorepo root (`infra/utils/src` → three levels up).
 */
export function getRootDir() {
    return path.resolve(__dirname, '..', '..', '..')
}

/**
 * Fetch all sub package names from the package directory
 * @param   {string[]} ignorePackages  a list of packages to be ignored
 * @param   {string}   packagesDir     optional override, used in tests
 * @returns {string[]}                 a list of sub packages
 */
export const getSubPackages = (ignorePackages: string[] = [], packagesDir = path.join(getRootDir(), 'packages')) => (
    fs.readdirSync(packagesDir).filter((pkg) => {
        const pkgPath = path.join(packagesDir, pkg)
        /**
         * ignore node_modules directory that is created by the link script to test the
         * wdio test runner, files sitting next to packages, and packages that don't
         * need to be compiled
         */
        return pkg !== 'node_modules' &&
            fs.statSync(pkgPath).isDirectory() &&
            !ignorePackages.includes(pkg) &&
            /**
             * ignore non-package directories and files such as packages/AGENTS.md
             */
            fs.existsSync(path.join(pkgPath, 'package.json'))
    })
)

export function buildPreface(id: string, title: string, titleSuffix: string, editUrl: string, description?: string) {
    return [
        '---',
        `id: ${id}`,
        `title: ${title} ${titleSuffix}`,
        ...(description ? [`description: ${JSON.stringify(description)}`] : []),
        `custom_edit_url: ${editUrl}`,
        '---\n',
        'import Tabs from \'@theme/Tabs\';',
        'import TabItem from \'@theme/TabItem\';\n'
    ]
}
