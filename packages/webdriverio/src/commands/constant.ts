/**
 * Constants around commands
 */
export const SCRIPT_PREFIX = '/* __wdio script__ */'
export const SCRIPT_SUFFIX = '/* __wdio script end__ */'

/**
 * These scripts are loaded by Esbuild at build time and injected into the bundle
 */
declare const WDIO_RESQ_SCRIPT: string
export const resqScript = WDIO_RESQ_SCRIPT
