import { builtinModules } from 'node:module'
import type { PackageJson } from 'type-fest'

export function getExternal(pkg: PackageJson) {
    return [
        'virtual:*',
        ...builtinModules,
        ...builtinModules.map((mod) => `node:${mod}`),
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.optionalDependencies || {}),
        './node.js'
    ]
}
