/**
 * Computes the version for a dev release (the "dev" option of `.github/workflows/publish.yml`).
 *
 * Lerna's `--canary` mode builds versions as `<next>-<preid>.<commits since tag>+<sha>`.
 * npm drops the `+<sha>` build metadata, so two branches with the same number of
 * commits since the last release tag end up with the same version, and the second
 * publish fails. We use the workflow run number instead: it increases with every run
 * of the workflow, no matter which branch it runs on.
 */
import path from 'node:path'
import { getRootDir, toFileUrl } from '@wdio/repo-utils'

export const RELEASE_TYPES = ['patch', 'minor', 'major', 'premajor'] as const
export type DevReleaseType = typeof RELEASE_TYPES[number]

const VERSION_REGEXP = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
const POSITIVE_INTEGER = /^[1-9]\d*$/
const DIST_TAG_REGEXP = /^[a-z][a-z0-9._-]*$/

export interface DevVersionOptions {
    /** current version, e.g. from `lerna.json` */
    version: string
    releaseType?: string
    /** `github.run_number` */
    runNumber: string | number
    /** `github.run_attempt`, a re-run gets its own version */
    runAttempt?: string | number
    preid?: string
}

/**
 * Returns the release version the dev release leads up to. Behaves like
 * `semver.inc()`: a prerelease of the same release line keeps its numbers,
 * e.g. `11.0.0-alpha.3` + `major` is `11.0.0`.
 */
export function getNextVersion (version: string, releaseType: DevReleaseType) {
    const match = version.match(VERSION_REGEXP)
    if (!match) {
        throw new Error(`Invalid version "${version}"`)
    }

    const [major, minor, patch] = match.slice(1, 4).map(Number)
    const isPrerelease = Boolean(match[4])

    if (releaseType === 'major' || releaseType === 'premajor') {
        return isPrerelease && minor === 0 && patch === 0
            ? `${major}.0.0`
            : `${major + 1}.0.0`
    }
    if (releaseType === 'minor') {
        return isPrerelease && patch === 0
            ? `${major}.${minor}.0`
            : `${major}.${minor + 1}.0`
    }
    return isPrerelease
        ? `${major}.${minor}.${patch}`
        : `${major}.${minor}.${patch + 1}`
}

function toPositiveInteger (name: string, value: string | number) {
    const str = String(value).trim()
    if (!POSITIVE_INTEGER.test(str)) {
        throw new Error(`Expected ${name} to be a positive integer, got "${value}"`)
    }
    return str
}

/**
 * e.g. `10.0.2-dev.42`, or `10.0.2-dev.42.2` for the second attempt of run 42
 */
export function getDevVersion ({ version, releaseType = 'patch', runNumber, runAttempt = 1, preid = 'dev' }: DevVersionOptions) {
    if (!RELEASE_TYPES.includes(releaseType as DevReleaseType)) {
        throw new Error(`Invalid release type "${releaseType}", expected one of ${RELEASE_TYPES.join(', ')}`)
    }

    const next = getNextVersion(version, releaseType as DevReleaseType)
    const run = toPositiveInteger('run number', runNumber)
    const attempt = toPositiveInteger('run attempt', runAttempt)
    return attempt === '1'
        ? `${next}-${preid}.${run}`
        : `${next}-${preid}.${run}.${attempt}`
}

/**
 * Dev releases must never move `latest`, and the tag is passed to Lerna on the
 * command line, so it may only be a plain tag name (no flags, no spaces).
 */
export function validateDistTag (distTag: string) {
    const tag = distTag.trim()
    if (tag === 'latest') {
        throw new Error('Dev releases can not be published with the "latest" dist-tag')
    }
    /**
     * npm rejects dist-tags that are valid semver ranges, e.g. `1.2.3` or `v10`
     */
    if (/^v?\d/.test(tag)) {
        throw new Error(`npm dist-tag "${distTag}" must not look like a version`)
    }
    if (!DIST_TAG_REGEXP.test(tag)) {
        throw new Error(`Invalid npm dist-tag "${distTag}", use lowercase letters, digits, ".", "_" or "-"`)
    }
    return tag
}

export async function computeDevVersion (env: NodeJS.ProcessEnv = process.env, rootDir = getRootDir()) {
    const pkg = (await import(toFileUrl(path.join(rootDir, 'lerna.json')), { with: { type: 'json' } })).default
    return {
        version: getDevVersion({
            version: pkg.version,
            releaseType: env.RELEASE_TYPE,
            runNumber: env.GITHUB_RUN_NUMBER ?? '',
            runAttempt: env.GITHUB_RUN_ATTEMPT
        }),
        distTag: validateDistTag(env.DIST_TAG ?? 'next')
    }
}
