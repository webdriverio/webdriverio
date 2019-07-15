export const DEFAULT_WIDTH = 1200
export const DEFAULT_HEIGHT = 900
export const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'

export const DEFAULT_FLAGS = [
    // Disable built-in Google Translate service
    '--disable-translate',
    // Disable all chrome extensions entirely
    '--disable-extensions',
    // Disable various background network services, including extension updating,
    //   safe browsing service, upgrade detector, translate, UMA
    '--disable-background-networking',
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
    '--disable-web-resources',
    '--disable-client-side-phishing-detection',
    '--enable-logging',
    '--log-level=0',
    '--password-store=basic',
    '--use-mock-keychain',
    '--test-type=webdriver',
    '--force-fieldtrials=SiteIsolationExtensions/Control'
]

export const CHROME_NAMES = ['chrome', 'googlechrome', 'google-chrome', 'chromium']
export const FIREFOX_NAMES = ['firefox', 'ff', 'mozilla', 'mozillafirefox']
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
