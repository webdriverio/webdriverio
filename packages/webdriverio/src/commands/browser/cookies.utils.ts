import type { SameSiteOptions } from '@wdio/protocols'
import { type remote } from 'webdriver'

/**
 * As per the BiDi spec, we must map enum from PascalCase to camleCase when sending commands
 * Let same site be "none" if stored cookie’s same-site-flag is "None", "lax" if it is "Lax", "strict" if it is "Strict", or "default" if it is "Default"
 * @see https://w3c.github.io/webdriver-bidi/#type-network-Cookie (point 9)
 *
 * @param sameSite
 * @returns
 */
export const mapSameSiteOptionsToBiDiSameSite = (sameSite: SameSiteOptions): remote.NetworkSameSite => {
    switch (sameSite) {
    case 'Lax':
        return 'lax'
    case 'Strict':
        return 'strict'
    case 'None':
        return 'none'
    case 'Default':
        return 'default'
    }
}

/**
 * As per the BiDi spec, we must map enum from PascalCase to camleCase when sending commands
 * Let same site be "none" if stored cookie’s same-site-flag is "None", "lax" if it is "Lax", "strict" if it is "Strict", or "default" if it is "Default"
 * @see https://w3c.github.io/webdriver-bidi/#type-network-Cookie (point 9)
 *
 * @param sameSite
 * @returns
 */
export const mapBiDiSameSiteToSameSiteOption = (sameSite: remote.NetworkSameSite): SameSiteOptions => {
    switch (sameSite) {
    case 'lax':
        return 'Lax'
    case 'strict':
        return 'Strict'
    case 'none':
        return 'None'
    case 'default':
        return 'Default'
    }
}
