#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'

import depcheck from 'depcheck'
import type { Options, Results } from 'depcheck'
import { getSubPackages, getRootDir } from '@wdio/repo-utils'

export type IgnoredPackages = Record<string, string[]>
export interface BrokenPackages extends Results {
    package?: string
    packagePath?: string
}

/**
 * Workaround for depcheck issue: https://github.com/depcheck/depcheck/issues/526
 */
export const IGNORE_PACKAGES: IgnoredPackages = {
    'wdio-browser-runner': ['virtual:wdio', 'mocha', '@nuxt/kit', 'unimport', 'unimport/unplugin', '@stencil/core']
}

export function formatBrokenPackages(brokenPackages: BrokenPackages[]) {
    let message = ''

    for (const result of brokenPackages) {
        message += `🚨 Broken Dependencies in ${result.package} 🚨\n`
        for (const [missingPkg, usage] of Object.entries(result.missing)) {
            message += `  * ${missingPkg} missing, used in:\n`
            message += usage.map((file) => `    * ${file}`).join('\n')
            message += '\n'
        }
    }

    return message
}

export interface DepcheckOptions {
    rootDir?: string
    packages?: string[]
}

export async function checkDependencies(options: DepcheckOptions = {}) {
    const rootDir = options.rootDir ?? getRootDir()
    const packages = options.packages ?? getSubPackages()

    /**
     * set proper size of max listener
     */
    EventEmitter.defaultMaxListeners = packages.length + 3

    const brokenPackages = (await Promise.all(packages.map(async (pkg) => {
        const packagePath = path.join(rootDir, 'packages', pkg)
        const depcheckOptions: Options = {
            ignorePatterns: ['build', 'tests'],
        }

        if (IGNORE_PACKAGES[pkg]) {
            depcheckOptions.ignoreMatches = IGNORE_PACKAGES[pkg]
        }

        const result: BrokenPackages = await depcheck(packagePath, depcheckOptions)
        result.package = pkg
        result.packagePath = packagePath
        return result
    }))).filter((result) => Object.keys(result.missing).length)

    return brokenPackages
}

export interface PackageManifest {
    name: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
}

export interface UntrackedPeer {
    package: string
    peer: string
    range: string
}

/**
 * ranges that Dependabot never updates
 */
const UNTRACKED_RANGES = new Set(['', '*', 'x', 'latest'])

/**
 * Dependabot only updates a `dependencies` or `devDependencies` range: a peer
 * that no workspace manifest declares there keeps the version it was locked at.
 */
export function findUntrackedPeers(manifests: PackageManifest[]): UntrackedPeer[] {
    const workspacePackages = new Set(manifests.map((manifest) => manifest.name))
    const tracked = new Set(manifests.flatMap((manifest) => (
        Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })
            .filter(([, range]) => !UNTRACKED_RANGES.has(range.trim()))
            .map(([name]) => name)
    )))

    return manifests.flatMap((manifest) => (
        Object.entries(manifest.peerDependencies ?? {})
            .filter(([peer]) => !workspacePackages.has(peer) && !tracked.has(peer))
            .map(([peer, range]) => ({ package: manifest.name, peer, range }))
    ))
}

export function formatUntrackedPeers(untrackedPeers: UntrackedPeer[]) {
    return untrackedPeers.map(({ package: pkg, peer, range }) => (
        `🚨 ${pkg}: peer ${peer} (${range}) is in no dependencies or devDependencies, add it to devDependencies so Dependabot updates it\n`
    )).join('')
}

export function readWorkspaceManifests(rootDir = getRootDir(), packages = getSubPackages()) {
    return ['.', 'e2e', 'tests', ...packages.map((pkg) => path.join('packages', pkg))]
        .map((dir) => JSON.parse(fs.readFileSync(path.join(rootDir, dir, 'package.json'), 'utf8')) as PackageManifest)
}
