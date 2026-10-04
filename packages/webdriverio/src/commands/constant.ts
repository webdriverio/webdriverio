/**
 * Constants around commands
 */
export const SCRIPT_PREFIX = '/* __wdio script__ */'
export const SCRIPT_SUFFIX = '/* __wdio script end__ */'

/**
 * These scripts are loaded by Esbuild at build time and injected into the bundle
 */
/**
 * `src/injected/react.ts`, the React component queries of `react$` and `react$$`
 */
declare const WDIO_REACT_SCRIPT: string
export const reactScript = WDIO_REACT_SCRIPT
/**
 * `src/injected/accessibility.ts` bundled with `dom-accessibility-api`
 */
declare const WDIO_A11Y_SCRIPT: string
export const accessibilityScript = WDIO_A11Y_SCRIPT
