import logger from '@wdio/logger'
import { Browser, BrowserPlatform, type BrowserProvider, type DownloadOptions } from '@puppeteer/browsers'
import { chromiumToElectron } from 'electron-to-chromium'

const log = logger('webdriver')

// ============================================================================
// Types
// ============================================================================

type ElectronRelease = {
    chrome: string;
    version: string;
}

/**
 * Options for ElectronChromedriverProvider.
 *
 * ElectronChromedriverProvider is a custom browser provider that downloads
 * Chromedriver from Electron releases instead of Chrome for Testing.
 */
export interface ElectronChromedriverProviderOptions {
    /**
     * Only use Electron provider for specific platforms.
     * If not specified, Electron releases will be used for all platforms.
     *
     * @example
     * ```typescript
     * // Only use for ARM64 Linux, let Chrome for Testing handle others
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
     * Has the highest priority in the version resolution fallback chain.
     *
     * The version resolution order is:
     * 1. Custom versionMapping (if provided)
     * 2. Cached electronjs.org mappings (if initializeElectronMappings() was called)
     * 3. electron-to-chromium package (always available)
     *
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

// ============================================================================
// Version Mapping Cache
// ============================================================================

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
        // parse as JSON — without this the reverse mapping would silently be built
        // empty and cached for the process lifetime, never falling back to the package.
        if (!response.ok) {
            throw new Error(`Failed to fetch Electron releases: HTTP ${response.status} ${response.statusText}`)
        }
        const releases = (await response.json()) as ElectronRelease[]

        // Build reverse mapping: Chromium version → Electron version
        const mapping: Record<string, string> = {}
        for (const { chrome, version } of releases) {
            mapping[chrome] = version
        }

        log.debug(`Fetched ${Object.keys(mapping).length} Electron release mappings`)
        return mapping
    })()

    // Cache the in-flight promise so concurrent callers share one request, but
    // evict it on failure so a later call can retry instead of caching the error.
    chromiumToElectronCache = pending
    pending.catch((error) => {
        log.debug('Failed to fetch Electron releases:', error)
        if (chromiumToElectronCache === pending) {
            chromiumToElectronCache = null
        }
    })

    return pending
}

// ============================================================================
// Helper Functions
// ============================================================================

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
    // Windows ARM64 special case: detectBrowserPlatform() returns WIN64 for both x64 and ARM64
    // We need to check process.arch to determine if we should use win32-arm64
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
 *
 * Attempts to fetch the latest mappings from electronjs.org first,
 * then falls back to the electron-to-chromium package.
 */
async function resolveElectronVersion(buildId: string, versionMapping?: Record<string, string>): Promise<string | null> {
    // Pass through bona fide Electron versions (3-part semver, e.g. "33.2.1").
    // Chromium build IDs are 4-part ("130.0.6723.2"), so part-count usually
    // separates the two — but a truncated 3-part Chromium id would slip through.
    // Chromium majors have been >= 100 since 2022 and only climb, while Electron's
    // are far lower, so a 3-part id whose major is in Chromium's range is treated
    // as Chromium and sent through the mapping lookup below rather than passed on.
    const electronVersionMatch = /^(\d+)\.\d+\.\d+$/.exec(buildId)
    if (electronVersionMatch && Number(electronVersionMatch[1]) < CHROMIUM_MIN_MAJOR_VERSION) {
        return buildId
    }

    // If custom mapping provided, try that first
    if (versionMapping && buildId in versionMapping) {
        return versionMapping[buildId]
    }

    // Try fetching from electronjs.org for most up-to-date mappings
    try {
        const mapping = await fetchChromiumToElectronMapping()
        if (buildId in mapping) {
            return mapping[buildId]
        }
    } catch (error: unknown) {
        // Fall through to electron-to-chromium package
        log.debug('Falling back to electron-to-chromium package', (error as Error).message)
    }

    // Fall back to electron-to-chromium package for offline/cached lookup
    const electronVersion = chromiumToElectron(buildId)

    // chromiumToElectron returns either:
    // - a string (for major version queries)
    // - an array of strings (for full version queries)
    // - undefined (if no match)
    if (Array.isArray(electronVersion)) {
        // Return the first (latest) matching Electron version
        return electronVersion[0] || null
    }

    return electronVersion || null
}

// ============================================================================
// ElectronChromedriverProvider Class
// ============================================================================

/**
 * Browser provider that uses Electron releases for Chromedriver.
 *
 * This is particularly useful for platforms where Chrome for Testing
 * doesn't provide binaries, such as Linux ARM64.
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
 * // For non-Electron apps - pass Chromium version, restrict to ARM64
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
        // Only support Chromedriver
        if (options.browser !== Browser.CHROMEDRIVER) {
            return false
        }

        // Check if we handle this platform
        if (this.#platforms && !this.#platforms.includes(options.platform)) {
            return false
        }

        // Check if we can resolve this version to an Electron version
        const electronVersion = await resolveElectronVersion(options.buildId, this.#versionMapping)
        return electronVersion !== null
    }

    async getDownloadUrl(options: DownloadOptions): Promise<URL | null> {
        // Resolve buildId to Electron version
        // (pass-through if already Electron version, map if Chromium version)
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
        // Electron chromedriver archives may have different structures.
        // Try the most common path first.
        const binaryName = options.platform.includes('win') ? 'chromedriver.exe' : 'chromedriver'
        return binaryName
    }

    getName(): string {
        return 'electron'
    }
}
