import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import { IGNORED_SUBPACKAGES_FOR_DOCS } from '../protocols.js'
import { getSubPackages, buildPreface } from '../utils/helpers.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const plugins = {
    reporter: ['Reporter', 'Reporter'],
    service: ['Services', 'Service']
}

/**
 * Generate docs for reporter and services
 * @param {object} sidebars website/sidebars
 */
export function generateReportersAndServicesDocs (sidebars) {
    const packages = getSubPackages(IGNORED_SUBPACKAGES_FOR_DOCS)

    for (const [type, [namePlural, nameSingular]] of Object.entries(plugins)) {
        const pkgs = packages.filter((pkg) => pkg.endsWith(`-${type}`) && pkg.split('-').length > 2)

        const items = []
        for (const pkg of pkgs) {
            const name = pkg.split('-').slice(1, -1)
            const id = `${name.join('-')}-${type}`
            const pkgName = name.map((n) => n[0].toUpperCase() + n.slice(1)).join(' ')
            const readme = fs.readFileSync(path.join(__dirname, '..', '..', 'packages', pkg, 'README.md')).toString()
            const preface = buildPreface(id, pkgName, nameSingular, `https://github.com/webdriverio/webdriverio/edit/main/packages/${pkg}/README.md`)
            const doc = [...preface, ...readme.split('\n').slice(3)].join('\n')
            fs.writeFileSync(path.join(__dirname, '..', '..', 'website', 'docs', `_${id}.md`), doc, { encoding: 'utf-8' })

            // eslint-disable-next-line no-console
            console.log(`Generated docs for ${pkg}`)
            items.push(id)
        }

        sidebars.docs.push({
            type: 'category',
            label: namePlural,
            items
        })
    }
}
