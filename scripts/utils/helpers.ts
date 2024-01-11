import path from 'node:path'
import url from 'node:url'
import shell from 'shelljs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * fetch all sub package names from the package directory
 * @param   {string[]} ignorePackages  a list of packages to be ignored
 * @returns {string[]}                 a list of sub packages
 */
export const getSubPackages = (ignorePackages: string[] = []) => shell.ls(path.join(__dirname, '..', '..', 'packages')).filter((pkg) => (
    /**
     * ignore node_modules directory that is created by the link script to test the
     * wdio test runner
     */
    pkg !== 'node_modules' &&
    /**
     * ignore packages that don't need to be compiled
     */
    !ignorePackages.includes(pkg)
)) as string[]

export function buildPreface(id: string, title: string, titleSuffix: string, editUrl: string) {
    return [
        '---',
        `id: ${id}`,
        `title: ${title} ${titleSuffix}`,
        `custom_edit_url: ${editUrl}`,
        '---\n',
        'import Tabs from \'@theme/Tabs\';',
        'import TabItem from \'@theme/TabItem\';\n'
    ]
}
