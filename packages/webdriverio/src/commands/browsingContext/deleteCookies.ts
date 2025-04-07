import { deleteCookies as deleteCookiesBrowser } from '../browser/deleteCookies.js'

/**
 * Delete cookies visible to the current page. By providing a cookie name it
 * just removes the single cookie or more when multiple names are passed.
 *
 * @alias browsingContext.deleteCookies
 * @param {StorageCookieFilter[]} filter  Use the filter property to identify and delete specific cookies based on matching criteria.
 */
export const deleteCookies = deleteCookiesBrowser
