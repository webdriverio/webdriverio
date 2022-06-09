import shell from 'shelljs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * fetch all sub package names from the package directory
 * @param   {string[]} ignorePackages  a list of packages to be ignored
 * @returns {string[]}                 a list of sub packages
 */
export const getSubPackages = (ignorePackages = []) => shell.ls(path.join(__dirname, '..', '..', 'packages')).filter((pkg) => (
    /**
     * ignore node_modules directory that is created by the link script to test the
     * wdio test runner
     */
    pkg !== 'node_modules' &&
    /**
     * ignore packages that don't need to be compiled
     */
    !ignorePackages.includes(pkg)
))

export function buildPreface(id, title, titleSuffix, editUrl) {
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
