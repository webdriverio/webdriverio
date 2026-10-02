/**
 * Role and accessible name computation for the page, from
 * `dom-accessibility-api` (the implementation Testing Library uses). The
 * compiler bundles this file into `WDIO_A11Y_SCRIPT`, which the `role/`
 * selector injects when the WebDriver BiDi accessibility locator is not
 * available.
 */
import { computeAccessibleName, getRole, isInaccessible } from 'dom-accessibility-api'

export interface AccessibilityApi {
    computeAccessibleName: typeof computeAccessibleName
    getRole: typeof getRole
    isInaccessible: typeof isInaccessible
}

;(window as unknown as { __wdioA11y?: AccessibilityApi }).__wdioA11y = { computeAccessibleName, getRole, isInaccessible }
