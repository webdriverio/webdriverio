/**
 * unicode characters
 * https://w3c.github.io/webdriver/webdriver-spec.html#character-types
 */
export const UNICODE_CHARACTERS = {
    'NULL': '\uE000',
    'Unidentified': '\uE000',
    'Cancel': '\uE001',
    'Help': '\uE002',
    'Backspace': '\uE003',
    'Back space': '\uE003',
    'Tab': '\uE004',
    'Clear': '\uE005',
    'Return': '\uE006',
    'Enter': '\uE007',
    'Shift': '\uE008',
    'Control': '\uE009',
    'Control Left': '\uE009',
    'Control Right': '\uE051',
    'Alt': '\uE00A',
    'Pause': '\uE00B',
    'Escape': '\uE00C',
    'Space': '\uE00D',
    ' ': '\uE00D',
    'PageUp': '\uE00E',
    'Pageup': '\uE00E',
    'Page_Up': '\uE00E',
    'PageDown': '\uE00F',
    'Pagedown': '\uE00F',
    'Page_Down': '\uE00F',
    'End': '\uE010',
    'Home': '\uE011',
    'ArrowLeft': '\uE012',
    'Left arrow': '\uE012',
    'Arrow_Left': '\uE012',
    'ArrowUp': '\uE013',
    'Up arrow': '\uE013',
    'Arrow_Up': '\uE013',
    'ArrowRight': '\uE014',
    'Right arrow': '\uE014',
    'Arrow_Right': '\uE014',
    'ArrowDown': '\uE015',
    'Down arrow': '\uE015',
    'Arrow_Down': '\uE015',
    'Insert': '\uE016',
    'Delete': '\uE017',
    'Semicolon': '\uE018',
    'Equals': '\uE019',
    'Numpad 0': '\uE01A',
    'Numpad 1': '\uE01B',
    'Numpad 2': '\uE01C',
    'Numpad 3': '\uE01D',
    'Numpad 4': '\uE01E',
    'Numpad 5': '\uE01F',
    'Numpad 6': '\uE020',
    'Numpad 7': '\uE021',
    'Numpad 8': '\uE022',
    'Numpad 9': '\uE023',
    'Multiply': '\uE024',
    'Add': '\uE025',
    'Separator': '\uE026',
    'Subtract': '\uE027',
    'Decimal': '\uE028',
    'Divide': '\uE029',
    'F1': '\uE031',
    'F2': '\uE032',
    'F3': '\uE033',
    'F4': '\uE034',
    'F5': '\uE035',
    'F6': '\uE036',
    'F7': '\uE037',
    'F8': '\uE038',
    'F9': '\uE039',
    'F10': '\uE03A',
    'F11': '\uE03B',
    'F12': '\uE03C',
    'Command': '\uE03D',
    'Meta': '\uE03D',
    'ZenkakuHankaku': '\uE040',
    'Zenkaku_Hankaku': '\uE040'
} as const

export const SUPPORTED_BROWSERNAMES = {
    chrome: ['chrome', 'googlechrome', 'chromium', 'chromium-browser'],
    firefox: ['firefox', 'ff', 'mozilla', 'mozilla firefox'],
    edge: ['edge', 'microsoftedge', 'msedge'],
    safari: ['safari', 'safari technology preview']
}

export const DEFAULT_HOSTNAME = '0.0.0.0'
export const DEFAULT_PROTOCOL = 'http'
export const DEFAULT_PATH = '/'
/* istanbul ignore next */
export const HOOK_DEFINITION = {
    type: 'object' as const,
    validate: (param: any) => {
        /**
         * option must be an array
         */
        if (!Array.isArray(param)) {
            throw new Error('a hook option needs to be a list of functions')
        }

        /**
         * array elements must be functions
         */
        for (const option of param) {
            /**
             * either a string
             */
            if (typeof option === 'function') {
                continue
            }

            throw new Error('expected hook to be type of function')
        }
    }
}