/**
 * Contains all settings as key value pair. You can find all available settings on the `about:config` page.
 */
type FirefoxSettings = Record<string, any>
interface NoProxySettings {
    proxyType: 'direct';
}

interface SystemProxySettings {
    proxyType: 'system';
}

interface AutomaticProxySettings {
    proxyType: 'pac';
    autoConfigUrl: string;
}

interface ManualProxySettings {
    proxyType: 'manual';
    ftpProxy?: string;
    httpProxy?: string;
    sslProxy?: string;
    socksProxy?: string;
}

type ProxySettings = NoProxySettings | SystemProxySettings | AutomaticProxySettings | ManualProxySettings;

export interface FirefoxProfileOptions extends FirefoxSettings {
    /**
     * Add one or multiple extensions to the browser session. All entries can be either an absolute path to the `.xpi`
     * file or the path to an unpacked Firefox extension directory.
     *
     * @default []
     */
    extensions?: string[]
    /**
     * Create Firefox profile based on an existing one by setting an absolute path to that profile.
     *
     * @default null
     */
    profileDirectory?: string
    /**
     * Set network proxy settings. The parameter `proxy` is a hash which structure depends on the value of mandatory `proxyType` key,
     * which takes one of the following string values:
     *  * `direct` - direct connection (no proxy)
     *  * `system` - use operating system proxy settings
     *  * `pac` - use automatic proxy configuration set based on the value of `autoconfigUrl` key
     *  * `manual` - manual proxy settings defined separately for different protocols using values from following keys: `ftpProxy`, `httpProxy`, `sslProxy`, `socksProxy`
     *
     * @example
     * ```js
     * // Automatic Proxy
     * export const config = {
     *     // ...
     *     services: [
     *         ['firefox-profile', {
     *             proxy: {
     *                 proxyType: 'pac',
     *                 autoconfigUrl: 'http://myserver/proxy.pac'
     *             }
     *         }]
     *     ],
     *     // ...
     * };
     * ```
     * ```js
     * // Manual HTTP Proxy
     * export const config = {
     *     // ...
     *     services: [
     *         ['firefox-profile', {
     *             proxy: {
     *                 proxyType: 'manual',
     *                 httpProxy: '127.0.0.1:8080'
     *             }
     *         }]
     *     ],
     *     // ...
     * };
     * ```
     * ```js
     * // Manual HTTP and HTTPS Proxy
     * export const config = {
     *     // ...
     *     services: [
     *         ['firefox-profile', {
     *             proxy: {
     *                 proxyType: 'manual',
     *                 httpProxy: '127.0.0.1:8080',
     *                 sslProxy: '127.0.0.1:8080'
     *             }
     *         }]
     *     ],
     *     // ...
     * };
     * ```
     */
    proxy?: ProxySettings
    /**
     * Please set this flag to `true` if you use Firefox v55 or lower.
     *
     * @default false
     */
    legacy?: boolean
}
