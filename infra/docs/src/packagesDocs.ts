/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs'
import path from 'node:path'
import { IGNORED_SUBPACKAGES_FOR_DOCS } from '@wdio/repo-utils/protocols'
import { getSubPackages, buildPreface, getRootDir } from '@wdio/repo-utils'

const plugins = {
    reporter: ['Reporters', 'Reporter'],
    service: ['Services', 'Service']
}

export interface PackagesDocsOptions {
    rootDir?: string
}

/**
 * Generate docs for reporter and services
 * @param {object} sidebars website/sidebars
 */
export function generateReportersAndServicesDocs (sidebars: any, options: PackagesDocsOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const packages = getSubPackages(IGNORED_SUBPACKAGES_FOR_DOCS)

    for (const [type, [namePlural, nameSingular]] of Object.entries(plugins)) {
        const pkgs = packages.filter((pkg) => pkg.endsWith(`-${type}`) && pkg.split('-').length > 2)

        const items: string[] = []
        for (const pkg of pkgs) {
            const name = pkg.split('-').slice(1, -1)
            const id = `${name.join('-')}-${type}`
            const pkgName = name.map((n) => n[0].toUpperCase() + n.slice(1)).join(' ')
            const readme = fs.readFileSync(path.join(rootDir, 'packages', pkg, 'README.md')).toString()
            const { description } = JSON.parse(fs.readFileSync(path.join(rootDir, 'packages', pkg, 'package.json'), 'utf-8'))
            const preface = buildPreface(id, pkgName, nameSingular, `https://github.com/webdriverio/webdriverio/edit/main/packages/${pkg}/README.md`, description)
            const doc = [...preface, ...readme.split('\n').slice(3)].join('\n')
            fs.writeFileSync(path.join(rootDir, 'website', 'docs', `_${id}.md`), doc, { encoding: 'utf-8' })

            console.log(`Generated docs for ${pkg}`)
            items.push(id)
        }

        sidebars.ecosystem.push({
            type: 'category',
            label: namePlural,
            items
        })
    }
}
