export const BROWSER_DESCRIPTION = [
    'device',
    'os',
    'osVersion',
    'os_version',
    'browserName',
    'browser',
    'browserVersion',
    'browser_version'
] as const

export type BrowserDescription = {
    [key in typeof BROWSER_DESCRIPTION[number]]?: string;
}
