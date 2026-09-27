import { WDIO_DEFAULTS } from '../../packages/webdriverio/src/constants.js'

/**
 * the default WebdriverIO ships with, captured before it is flipped below
 */
export const SHIPPED_STRICT_SELECTORS_DEFAULT = WDIO_DEFAULTS.strictSelectors!.default

/**
 * As of v10 the `$` command is strict by default and throws when a selector
 * resolves to more than one element (see #15666).
 *
 * The unit test fetch mock answers every "find elements" request with three
 * element references, which would make virtually every `$` call in the existing
 * unit tests a strict mode violation. Those tests are about the commands they
 * cover, not about selector strictness, so the default is flipped back here.
 *
 * Tests that cover strict mode itself pass `strictSelectors` explicitly when
 * creating their session, which takes precedence over this default.
 */
WDIO_DEFAULTS.strictSelectors!.default = false
