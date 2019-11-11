export const DEFAULT_WIDTH = 1200
export const DEFAULT_HEIGHT = 900
export const DEFAULT_X_POSITION = 0
export const DEFAULT_Y_POSITION = 0

export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

export const DEFAULT_FLAGS = [
    // Disable all chrome extensions entirely
    '--disable-extensions',
    // Disable various background network services, including extension updating,
    //   safe browsing service, upgrade detector, translate, UMA
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    // Disable syncing to a Google account
    '--disable-sync',
    // Disable reporting to UMA, but allows for collection
    '--metrics-recording-only',
    // Disable installation of default apps on first run
    '--disable-default-apps',
    // Mute any audio
    '--mute-audio',
    // Skip first run wizards
    '--no-first-run',
    // chromedriver flags
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-client-side-phishing-detection',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-component-extensions-with-background-pages',
    '--disable-breakpad',
    '--disable-dev-shm-usage',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    /*
     * `site-per-process` affects `page.frames()`, see #4471
     * `TranslateUI` disables built-in Google Translate service
     */
    '--disable-features=site-per-process,TranslateUI,BlinkGenPropertyTrees'
]

export const CHROME_NAMES = ['chrome', 'googlechrome', 'headlesschrome', 'google-chrome', 'chromium']
export const FIREFOX_NAMES = ['firefox', 'ff', 'mozilla', 'mozillafirefox', 'headless firefox', 'headlessfirefox']
export const EDGE_NAMES = ['edge', 'msedge', 'microsoft-edge', 'microsoftedge']

export const DEFAULTS = {
    capabilities: {
        type: 'object',
        required: true
    },
    /**
     * Level of logging verbosity
     */
    logLevel: {
        type: 'string',
        default: 'info',
        match: /(trace|debug|info|warn|error|silent)/
    },
    /**
     * Timeout for any request to the Selenium server
     */
    connectionPollInterval: {
        type: 'number',
        default: 500
    },
    /**
     * maxConnectionRetries in chrome-launcher
     */
    connectionRetryCount: {
        type: 'number',
        default: 50
    }
}

export const DEFAULT_IMPLICIT_TIMEOUT = 0
export const DEFAULT_PAGELOAD_TIMEOUT = 5 * 60 * 1000 // 5 min
export const DEFAULT_SCRIPT_TIMEOUT = 30 * 1000 // 30s

export const SUPPORTED_SELECTOR_STRATEGIES = ['css selector', 'tag name', 'xpath', 'link text', 'partial link text']
export const SERIALIZE_PROPERTY = 'data-devtoolsdriver-fetchedElement'
export const SERIALIZE_FLAG = '__executeElement'

export const ERROR_MESSAGES = {
    staleElement: {
        name: 'stale element reference',
        message: 'stale element reference: The element reference is stale; either the element is no longer attached to the DOM, it is not in the current frame context, or the document has been refreshed'
    }
}
