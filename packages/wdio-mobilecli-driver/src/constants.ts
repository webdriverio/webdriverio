export const PACKAGE_NAME = '@wdio/mobilecli-driver'

/**
 * where `mobilecli server start` listens by default
 */
export const DEFAULT_PROTOCOL = 'http'
export const DEFAULT_HOSTNAME = 'localhost'
export const DEFAULT_PORT = 12000

/**
 * the server has one JSON-RPC endpoint
 */
export const RPC_ENDPOINT = 'rpc'

/**
 * How long one call to the server may take. The first call to a device can
 * be slow: the server installs and starts its agent on the device.
 */
export const DEFAULT_REQUEST_TIMEOUT = 120000

/**
 * mobilecli has no contexts yet: the driver always is in the native app
 */
export const NATIVE_CONTEXT = 'NATIVE_APP'

/**
 * the platform names of mobilecli and how WebdriverIO capabilities spell them
 */
export const PLATFORM_NAMES: Record<string, string> = {
    ios: 'iOS',
    android: 'Android'
}

export const INSTALL_HINT = 'Install mobilecli ("npm install -g mobilecli") and start the server with "mobilecli server start".'
