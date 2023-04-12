import { createRequire } from 'node:module'
import fs from 'node:fs'

const require = createRequire(import.meta.url)

export function generatePackageVersion(packageRoot) {

    const pkg = require(`../${packageRoot}/package.json`)
    const content = `export const PKG_VERSION = ${JSON.stringify(pkg.version).replaceAll('"', "'")}`

    console.log(`${packageRoot} - ${content}`)

    fs.writeFileSync(`${packageRoot}/src/version.ts`, content)
}
