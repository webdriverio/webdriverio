/**
 * logger colors
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var COLORS = {
    black: '\x1b[0;30m',
    dkgray: '\x1b[1;30m',
    brick: '\x1b[0;31m',
    red: '\x1b[1;31m',
    dkred: '\x1b[31m',
    green: '\x1b[0;32m',
    lime: '\x1b[1;32m',
    brown: '\x1b[0;33m',
    yellow: '\x1b[1;33m',
    navy: '\x1b[0;34m',
    blue: '\x1b[1;34m',
    violet: '\x1b[0;35m',
    magenta: '\x1b[1;35m',
    teal: '\x1b[0;36m',
    cyan: '\x1b[1;36m',
    ltgray: '\x1b[0;37m',
    white: '\x1b[1;37m',
    reset: '\x1b[0m'
};

/**
 * selenium error codes
 * https://w3c.github.io/webdriver/webdriver-spec.html#dfn-error-code
 */
var ERROR_CODES = {
    '-1': { id: 'Unknown', message: 'Remote end send an unknown status code.' },
    '0': { id: 'Success', message: 'The command executed successfully.' },
    '6': { id: 'NoSuchDriver', message: 'A session is either terminated or not started' },
    '7': { id: 'NoSuchElement', message: 'An element could not be located on the page using the given search parameters.' },
    '8': { id: 'NoSuchFrame', message: 'A request to switch to a frame could not be satisfied because the frame could not be found.' },
    '9': { id: 'UnknownCommand', message: 'The requested resource could not be found, or a request was received using an HTTP method that is not supported by the mapped resource.' },
    '10': { id: 'StaleElementReference', message: 'An element command failed because the referenced element is no longer attached to the DOM.' },
    '11': { id: 'ElementNotVisible', message: 'An element command could not be completed because the element is not visible on the page.' },
    '12': { id: 'InvalidElementState', message: 'An element command could not be completed because the element is in an invalid state (e.g. attempting to click a disabled element).' },
    '13': { id: 'UnknownError', message: 'An unknown server-side error occurred while processing the command.' },
    '15': { id: 'ElementIsNotSelectable', message: 'An attempt was made to select an element that cannot be selected.' },
    '17': { id: 'JavaScriptError', message: 'An error occurred while executing user supplied JavaScript.' },
    '19': { id: 'XPathLookupError', message: 'An error occurred while searching for an element by XPath.' },
    '21': { id: 'Timeout', message: 'An operation did not complete before its timeout expired.' },
    '23': { id: 'NoSuchWindow', message: 'A request to switch to a different window could not be satisfied because the window could not be found.' },
    '24': { id: 'InvalidCookieDomain', message: 'An illegal attempt was made to set a cookie under a different domain than the current page.' },
    '25': { id: 'UnableToSetCookie', message: 'A request to set a cookie\'s value could not be satisfied.' },
    '26': { id: 'UnexpectedAlertOpen', message: 'A modal dialog was open, blocking this operation' },
    '27': { id: 'NoAlertOpenError', message: 'An attempt was made to operate on a modal dialog when one was not open.' },
    '28': { id: 'ScriptTimeout', message: 'A script did not complete before its timeout expired.' },
    '29': { id: 'InvalidElementCoordinates', message: 'The coordinates provided to an interactions operation are invalid.' },
    '30': { id: 'IMENotAvailable', message: 'IME was not available.' },
    '31': { id: 'IMEEngineActivationFailed', message: 'An IME engine could not be started.' },
    '32': { id: 'InvalidSelector', message: 'Argument was an invalid selector (e.g. XPath/CSS).' },
    '33': { id: 'SessionNotCreatedException', message: 'A new session could not be created.' },
    '34': { id: 'ElementNotScrollable', message: 'Element cannot be scrolled into view.' },

    // WebdriverIO specific error codes
    '100': { id: 'SelectorTimeoutError', message: 'Request timed out after the element was still found on the page.' },
    '101': { id: 'NoSessionIdError', message: 'A session id is required for this command but wasn\'t found in the response payload' },
    '102': { id: 'GridApiError', message: 'A call to the Selenium Grid API failed' }
};

/**
 * unicode characters
 * https://w3c.github.io/webdriver/webdriver-spec.html#character-types
 */
var UNICODE_CHARACTERS = {
    'NULL': '',
    'Cancel': '',
    'Help': '',
    'Back space': '',
    'Tab': '',
    'Clear': '',
    'Return': '',
    'Enter': '',
    'Shift': '',
    'Control': '',
    'Alt': '',
    'Pause': '',
    'Escape': '',
    'Space': '',
    'Pageup': '',
    'Page_Up': '',
    'Pagedown': '',
    'Page_Down': '',
    'End': '',
    'Home': '',
    'Left arrow': '',
    'Arrow_Left': '',
    'Up arrow': '',
    'Arrow_Up': '',
    'Right arrow': '',
    'Arrow_Right': '',
    'Down arrow': '',
    'Arrow_Down': '',
    'Insert': '',
    'Delete': '',
    'Semicolon': '',
    'Equals': '',
    'Numpad 0': '',
    'Numpad 1': '',
    'Numpad 2': '',
    'Numpad 3': '',
    'Numpad 4': '',
    'Numpad 5': '',
    'Numpad 6': '',
    'Numpad 7': '',
    'Numpad 8': '',
    'Numpad 9': '',
    'Multiply': '',
    'Add': '',
    'Separator': '',
    'Subtract': '',
    'Decimal': '',
    'Divide': '',
    'F1': '',
    'F2': '',
    'F3': '',
    'F4': '',
    'F5': '',
    'F6': '',
    'F7': '',
    'F8': '',
    'F9': '',
    'F10': '',
    'F11': '',
    'F12': '',
    'Command': '',
    'Meta': '',
    'Zenkaku_Hankaku': ''
};

exports.COLORS = COLORS;
exports.ERROR_CODES = ERROR_CODES;
exports.UNICODE_CHARACTERS = UNICODE_CHARACTERS;
