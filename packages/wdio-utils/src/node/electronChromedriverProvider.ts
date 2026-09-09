import logger from '@wdio/logger'
import { Browser, BrowserPlatform, type BrowserProvider, type DownloadOptions } from '@puppeteer/browsers'
import { chromiumToElectron } from 'electron-to-chromium'

const log = logger('webdriver')

type ElectronRelease = {
    chrome: string;
    version: string;
}

/**
 * ElectronChromedriverProvider downloads Chromedriver from Electron releases
 * instead of Chrome for Testing.
 */
export interface ElectronChromedriverProviderOptions {
    /**
     * Only use Electron provider for specific platforms.
     * If not specified, Electron releases will be used for all platforms.
     *
     * @example
     * ```typescript
     * // Restrict this provider to Linux ARM64, where it acts as the fallback
     * // source behind Chrome for Testing; other platforms use their default source
      * new ElectronChromedriverProvider({ platforms: [BrowserPlatform.LINUX_ARM] })
     * ```
     */
    platforms?: BrowserPlatform[];

    /**
     * Custom base URL for Electron releases.
     * @default 'https://github.com/electron/electron/releases/download/'
     */
    baseUrl?: string;

    /**
     * Optional custom version mapping from Chromium version to Electron version.
     * Takes priority over the electronjs.org and electron-to-chromium lookups below.
     * Only provide this if you need to override specific version mappings.
     *
     * @example
     * ```typescript
      * new ElectronChromedriverProvider({
      *   versionMapping: {
      *     '131.0.0.0': '34.0.0' // Override for unreleased versions
      *   }
      * })
     * ```
     */
    versionMapping?: Record<string, string>;
}

/**
 * Cache for the in-flight/resolved Chromium → Electron version mapping.
 * Fetched from electronjs.org/headers/index.json on first use. Stored as the
 * promise itself so concurrent callers (e.g. supports() and getDownloadUrl())
 * share a single network request instead of each firing their own.
 */
let chromiumToElectronCache: Promise<Record<string, string>> | null = null

/**
 * Resets the Chromium → Electron version mapping cache.
 * Useful for testing.
 */
export function resetElectronMappingCache(): void {
    chromiumToElectronCache = null
}

/**
 * Fetches the Electron releases list and builds a Chromium → Electron mapping.
 * This provides the most up-to-date version information.
 */
function fetchChromiumToElectronMapping(): Promise<Record<string, string>> {
    if (chromiumToElectronCache) {
        return chromiumToElectronCache
    }

    const pending = (async () => {
        log.debug('Fetching Electron releases for Chromium → Electron version mapping...')
        const response = await fetch('https://electronjs.org/headers/index.json')
        // Guard against non-2xx responses (e.g. rate limiting) whose body may still
        // parse as JSON; without this the reverse mapping would silently be built
        // empty and cached for the process lifetime, never falling back to the package.
        if (!response.ok) {
            throw new Error(`Failed to fetch Electron releases: HTTP ${response.status} ${response.statusText}`)
        }
        const releases = (await response.json()) as ElectronRelease[]

        const mapping: Record<string, string> = {}
        for (const { chrome, version } of releases) {
            mapping[chrome] = version
        }

        log.debug(`Fetched ${Object.keys(mapping).length} Electron release mappings`)
        return mapping
    })()

    // Evict the cached promise on failure so a later call can retry instead of caching the error.
    chromiumToElectronCache = pending
    pending.catch((error) => {
        log.debug('Failed to fetch Electron releases:', error)
        if (chromiumToElectronCache === pending) {
            chromiumToElectronCache = null
        }
    })

    return pending
}

/**
 * Lowest Chromium major version we expect to see. Chrome for Testing has shipped
 * majors >= 100 since 2022 and the number only increases, so it's a stable lower
 * bound for telling a 3-part Chromium id apart from a lower-numbered Electron one.
 */
const CHROMIUM_MIN_MAJOR_VERSION = 100

/**
 * Maps BrowserPlatform to Electron release platform names.
 */
function mapPlatformForElectron(platform: BrowserPlatform): string {
    // detectBrowserPlatform() returns WIN64 for both x64 and ARM64, so arch disambiguates
    if (platform === BrowserPlatform.WIN64 && process.arch === 'arm64') {
        return 'win32-arm64'
    }

    const platformMap: Record<BrowserPlatform, string> = {
        [BrowserPlatform.LINUX]: 'linux-x64',
        [BrowserPlatform.LINUX_ARM]: 'linux-arm64',
        [BrowserPlatform.MAC]: 'darwin-x64',
        [BrowserPlatform.MAC_ARM]: 'darwin-arm64',
        [BrowserPlatform.WIN32]: 'win32-ia32',
        [BrowserPlatform.WIN64]: 'win32-x64'
    }

    const mapped = platformMap[platform]
    if (!mapped) {
        throw new Error(`Unsupported platform for Electron: ${platform}`)
    }
    return mapped
}

/**
 * Resolves a version to an Electron version.
 * Handles both Electron versions (pass-through) and Chromium versions (mapped).
 */
async function resolveElectronVersion(buildId: string, versionMapping?: Record<string, string>): Promise<string | null> {
    // Electron versions are 3-part, Chromium build ids 4-part, except a truncated
    // 3-part Chromium id, which CHROMIUM_MIN_MAJOR_VERSION catches below.
    const electronVersionMatch = /^(\d+)\.\d+\.\d+$/.exec(buildId)
    if (electronVersionMatch && Number(electronVersionMatch[1]) < CHROMIUM_MIN_MAJOR_VERSION) {
        return buildId
    }

    if (versionMapping && buildId in versionMapping) {
        return versionMapping[buildId]
    }

    try {
        const mapping = await fetchChromiumToElectronMapping()
        if (buildId in mapping) {
            return mapping[buildId]
        }
    } catch (error: unknown) {
        // Fall through to electron-to-chromium package
        log.debug('Falling back to electron-to-chromium package', (error as Error).message)
    }

    // chromiumToElectron returns a string (major query), an array (full query, newest first), or undefined
    const electronVersion = chromiumToElectron(buildId)
    return (Array.isArray(electronVersion) ? electronVersion[0] : electronVersion) || null
}

/**
 * Browser provider that uses Electron releases for Chromedriver.
 *
 * This serves two roles: the primary source on platforms Chrome for Testing
 * does not build at all, such as Windows ARM64, and a fallback where Chrome for
 * Testing's coverage is incomplete, such as Chromium milestones on Linux ARM64
 * that predate its arm64 Chromedriver.
 *
 * **Version Mapping Strategy:**
 *
 * The provider uses a two-tier fallback for Chromium → Electron version mapping:
 * 1. **electronjs.org releases API** (most up-to-date, fetched on first use and cached)
 * 2. **electron-to-chromium package** (offline fallback, may be slightly outdated)
 *
 * **Supports two modes:**
 *
 * 1. **Electron apps**: Pass Electron version directly (e.g., "33.2.1")
 * 2. **Non-Electron apps**: Pass Chromium version (e.g., "130.0.6723.2"),
 *    which gets mapped to an Electron version automatically
 *
 * @example
 * ```typescript
 * // For Electron apps - pass Electron version
 * const buildId = electronVersion; // "33.2.1"
 *
 * // For non-Electron apps - pass a Chromium version; scope the provider to Linux ARM64
 * const providers = [
 *   new ElectronChromedriverProvider({
 *     platforms: [BrowserPlatform.LINUX_ARM]
 *   })
 * ];
 * await install({
 *   browser: Browser.CHROMEDRIVER,
 *   buildId: '130.0.6723.2', // Chromium version
 *   providers
 * });
 * // → Fetches mapping from electronjs.org (cached after first fetch)
 * // → Maps to Electron v33.2.1
 * // → Downloads chromedriver from Electron v33.2.1 release
 * ```
 */
export class ElectronChromedriverProvider implements BrowserProvider {
    readonly #platforms?: BrowserPlatform[]
    readonly #baseUrl: string
    readonly #versionMapping?: Record<string, string>

    constructor(options: ElectronChromedriverProviderOptions = {}) {
        this.#platforms = options.platforms
        this.#baseUrl = options.baseUrl || 'https://github.com/electron/electron/releases/download/'
        this.#versionMapping = options.versionMapping
    }

    async supports(options: DownloadOptions): Promise<boolean> {
        if (options.browser !== Browser.CHROMEDRIVER) {
            return false
        }

        if (this.#platforms && !this.#platforms.includes(options.platform)) {
            return false
        }

        const electronVersion = await resolveElectronVersion(options.buildId, this.#versionMapping)
        return electronVersion !== null
    }

    async getDownloadUrl(options: DownloadOptions): Promise<URL | null> {
        const electronVersion = await resolveElectronVersion(options.buildId, this.#versionMapping)
        if (!electronVersion) {
            return null
        }

        const electronPlatform = mapPlatformForElectron(options.platform)
        const urlPath = `v${electronVersion}/chromedriver-v${electronVersion}-${electronPlatform}.zip`
        return new URL(urlPath, this.#baseUrl)
    }

    getExecutablePath(options: {
        browser: Browser
        buildId: string
        platform: BrowserPlatform
    }): string {
        // Archive layouts vary by Electron version; this covers the common case only
        const binaryName = options.platform.includes('win') ? 'chromedriver.exe' : 'chromedriver'
        return binaryName
    }

    getName(): string {
        return 'electron'
    }
}
