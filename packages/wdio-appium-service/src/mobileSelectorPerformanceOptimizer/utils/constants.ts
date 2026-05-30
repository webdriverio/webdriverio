export const LOG_PREFIX = 'Mobile Selector Performance'

export const SINGLE_ELEMENT_COMMANDS = ['$', 'custom$'] as const
export const MULTIPLE_ELEMENT_COMMANDS = ['$$', 'custom$$'] as const
export const USER_COMMANDS = [...SINGLE_ELEMENT_COMMANDS, ...MULTIPLE_ELEMENT_COMMANDS] as const

export const REPORT_INDENT_SUMMARY = '   '
export const REPORT_INDENT_FILE = '   '
export const REPORT_INDENT_SUITE = '      '
export const REPORT_INDENT_TEST = '         '
export const REPORT_INDENT_SELECTOR = '            '
export const REPORT_INDENT_SHARED = '      '
export const REPORT_INDENT_SHARED_DETAIL = '         '
export const REPORT_INDENT_WHY_CHANGE = '      '
export const REPORT_INDENT_DOCS = '        '
