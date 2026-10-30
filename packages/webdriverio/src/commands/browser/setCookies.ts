import logger from '@wdio/logger'
import type { Cookie } from '@wdio/protocols'
import type { remote } from 'webdriver'

import { isBrowsingContext } from '../../session/browsingContext.js'
import { getCookiePartition, getWindowInfo, windowCookieScope, type WindowCookieScope } from '../../utils/cookiePartition.js'

const log = logger('webdriverio')

/**
 *
 * Sets one or more [cookies](https://w3c.github.io/webdriver/#cookies) for the current page. Make sure you are
 * on the page that should receive the cookie. You can't set a cookie for an arbitrary page without
 * being on that page.
 *
 * <example>
    :setCookies.js
    it('should set a cookie for the page', async () => {
        await browser.url('/')

        // set a single cookie
        await browser.setCookies({
            name: 'test1',
            value: 'one'
            // The below options are optional
            // path: '/foo', // The cookie path. Defaults to "/"
            // domain: '.example.com', // The domain the cookie is visible to. Defaults to the current browsing context’s active document’s URL domain
            // secure: true, // Whether the cookie is a secure cookie. Defaults to false
            // httpOnly: true, // Whether the cookie is an HTTP only cookie. Defaults to false
            // expiry: 1551393875 // When the cookie expires, specified in seconds since Unix Epoch
        })

        // set multiple cookies
        await browser.setCookies([
            {name: 'test2', value: 'two'},
            {name: 'test3', value: 'three'}
        ])

        const cookies = await browser.getCookies()
        console.log(cookies);
        // outputs:
        // [
        //      {name: 'test1', value: 'one', domain: 'www.example.com'},
        //      {name: 'test2', value: 'two', domain: 'www.example.com'},
        //      {name: 'test3', value: 'three', domain: 'www.example.com'}
        // ]
    });
 * </example>
 *
 * @alias browser.setCookies
 * @param {`Array<WebDriverCookie>|WebDriverCookie`} cookie   cookie object or object array.
 * @param {String=}       cookie.name     The name of the cookie.
 * @param {String=}       cookie.value    The cookie value.
 * @param {String=}       cookie.path     The cookie path. Defaults to "/" if omitted when adding a cookie.
 * @param {String=}       cookie.domain   The domain the cookie is visible to. Defaults to the current browsing context’s active document’s URL domain if omitted when adding a cookie. With `wdio:experimentalBiDiCommands` and in a parallel test, the domain goes to WebDriver BiDi as given: `example.com` is a host-only cookie, `.example.com` also goes to the subdomains.
 * @param {Boolean=}      cookie.secure   Whether the cookie is a secure cookie. Defaults to false if omitted when adding a cookie.
 * @param {Boolean=}      cookie.httpOnly Whether the cookie is an HTTP only cookie. Defaults to false if omitted when adding a cookie.
 * @param {Number=}       cookie.expiry   When the cookie expires, specified in seconds since Unix Epoch. Must not be set if omitted when adding a cookie.
 * @param {String=}       cookie.sameSite Whether the cookie applies to a SameSite policy. Defaults to None if omitted when adding a cookie. Can be set to "Lax", "Strict" or "None", in any case.
 * @uses protocol/addCookie
 * @type cookie
 *
 */
export async function setCookies(
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    cookieObjs: Cookie | Cookie[]
): Promise<void> {
    const cookieObjsList = !Array.isArray(cookieObjs) ? [cookieObjs] : cookieObjs

    if (cookieObjsList.some(obj => (typeof obj !== 'object'))) {
        throw new Error('Invalid input (see https://webdriver.io/docs/api/browser/setCookies for documentation)')
    }

    /**
     * if session doesn't use Bidi, use WebDriver Classic command
     */
    if (!this.isBidi) {
        const classic = isBrowsingContext(this) ? this.browser : this
        await Promise.all(cookieObjsList.map(cookieObj => classic.addCookie(toClassicCookie(cookieObj))))
        return
    }

    const scope = await windowCookieScope(this)
    if (scope) {
        await setWindowCookies(scope, cookieObjsList)
        return
    }

    const browser = isBrowsingContext(this) ? this.browser : this
    if (isBrowsingContext(this)) {
        const origin = this.url.startsWith('http') ? this.url : await this.getUrl()
        const url = new URL(origin)
        await Promise.all(cookieObjsList.map((cookie) => (
            browser.storageSetCookie({
                cookie: toBidiCookie(cookie, cookie.domain || url.hostname),
                partition: {
                    type: 'context',
                    context: this.contextId
                }
            })
        )))
        return
    }

    /**
     * only fetch current url of browsing context if not all cookies have a domain set
     */
    let url: URL
    try {
        url = new URL(await this.getUrl())
        if (url.origin === 'null') {
            await Promise.all(cookieObjsList.map(cookieObj => this.addCookie(toClassicCookie(cookieObj))))
            return
        }
    } catch {
        await Promise.all(cookieObjsList.map(cookieObj => this.addCookie(toClassicCookie(cookieObj))))
        return
    }

    try {
        await Promise.all(cookieObjsList.map((cookie) => (
            this.storageSetCookie({
                cookie: toBidiCookie(cookie, cookie.domain || url.hostname),
                partition: getCookiePartition(url.origin)
            })
        )))
    } catch (err) {
        log.warn(`BiDi setCookies failed, falling back to classic: ${(err as Error).message}`)
        await Promise.all(cookieObjsList.map(cookieObj => this.addCookie(toClassicCookie(cookieObj))))
    }
    return
}

/**
 * A window of a parallel test, or a session with `wdio:experimentalBiDiCommands`: falling back to
 * addCookie would act on the focused window, so BiDi errors propagate.
 */
async function setWindowCookies(scope: WindowCookieScope, cookies: Cookie[]) {
    const host = cookies.every((cookie) => cookie.domain) ? undefined : (await getWindowInfo(scope)).url?.hostname
    const bidiCookies = cookies.map((cookie) => {
        const domain = cookie.domain || host
        if (!domain) {
            throw new Error(`Can not set the cookie "${cookie.name}" without a domain: the page has no host (for example about:blank). Open a page first, or set the "domain" of the cookie.`)
        }
        return toBidiCookie(cookie, domain)
    })
    await Promise.all(bidiCookies.map((cookie) => scope.browser.storageSetCookie({ cookie, partition: scope.partition })))
}

/**
 * The two W3C protocols spell sameSite differently, and each one rejects the other spelling:
 * WebDriver Classic uses "Strict" / "Lax" / "None", WebDriver BiDi uses "strict" / "lax" / "none" / "default".
 * The commands accept both and send each protocol its own spelling.
 */
const CLASSIC_SAME_SITE: Record<string, 'Strict' | 'Lax' | 'None'> = { strict: 'Strict', lax: 'Lax', none: 'None' }

function toClassicCookie(cookie: Cookie): Cookie {
    if (typeof cookie.sameSite !== 'string') {
        return cookie
    }
    const { sameSite, ...rest } = cookie
    // Classic has no "default": leave it unset, as the spec says for no same site policy
    if (sameSite.toLowerCase() === 'default') {
        return rest
    }
    return { ...rest, sameSite: CLASSIC_SAME_SITE[sameSite.toLowerCase()] ?? sameSite }
}

function toBidiCookie({ sameSite, ...cookie }: Cookie, domain: string): remote.StoragePartialCookie {
    return {
        ...cookie,
        domain,
        ...(typeof sameSite === 'string' ? { sameSite: sameSite.toLowerCase() as remote.NetworkSameSite } : {}),
        value: { type: 'string', value: cookie.value }
    }
}
