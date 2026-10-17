import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

import { minVersion, satisfies, validRange } from 'semver'
import { getRootDir, getSubPackages } from '@wdio/repo-utils'

import type { DepcheckOptions } from './index.js'

interface PackageManifest {
    name?: string
    private?: boolean
    engines?: { node?: string }
    dependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
}

export interface BrokenEngine {
    package: string
    dependency?: string
    message: string
}

/** Check installed direct production dependencies against each published package's Node floor. */
export function checkDependencyEngines(options: DepcheckOptions = {}): BrokenEngine[] {
    const rootDir = options.rootDir ?? getRootDir()
    const packages = options.packages ?? getSubPackages([], path.join(rootDir, 'packages'))
    const broken: BrokenEngine[] = []

    for (const pkg of packages) {
        const manifestPath = path.join(rootDir, 'packages', pkg, 'package.json')
        const manifest: PackageManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        if (manifest.private) {
            continue
        }
        const packageName = manifest.name ?? pkg
        const nodeRange = manifest.engines?.node
        const minimum = nodeRange && validRange(nodeRange) ? minVersion(nodeRange) : null
        if (!minimum) {
            broken.push({ package: packageName, message: 'Missing or invalid engines.node; cannot determine the supported Node.js minimum' })
            continue
        }

        const require = createRequire(manifestPath)
        const dependencies = { ...manifest.dependencies, ...manifest.optionalDependencies }
        for (const dependency of Object.keys(dependencies)) {
            // Resolve the manifest without requiring a package.json export. This also follows workspace links.
            const installedPath = require.resolve.paths(dependency)?.map((directory) => (
                path.join(directory, dependency, 'package.json')
            )).find((file) => fs.existsSync(file))
            if (!installedPath) {
                if (!manifest.optionalDependencies?.[dependency]) {
                    broken.push({ package: packageName, dependency, message: 'Production dependency is not installed; run pnpm install before checking engines' })
                }
                continue
            }

            const installed: PackageManifest = JSON.parse(fs.readFileSync(installedPath, 'utf8'))
            const required = installed.engines?.node
            if (required && (!validRange(required) || !satisfies(minimum, required))) {
                broken.push({
                    package: packageName,
                    dependency,
                    message: `Requires Node.js ${required}, which does not support the package minimum ${minimum}`
                })
            }
        }
    }

    return broken
}

export function formatBrokenEngines(broken: BrokenEngine[]): string {
    return broken.map(({ package: packageName, dependency, message }) => (
        `🚨 Incompatible Node.js engines in ${packageName}${dependency ? ` → ${dependency}` : ''}: ${message}`
    )).join('\n')
}
