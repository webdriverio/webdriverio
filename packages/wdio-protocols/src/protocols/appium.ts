import Chromium from './chromium.js'

const getLogTypes = '/session/:sessionId/se/log/types' as const
const getLog = '/session/:sessionId/se/log' as const

const chromiumLogCommands = {
    [getLogTypes]: Chromium[getLogTypes],
    [getLog]: Chromium[getLog],
}

export default {
    ...chromiumLogCommands,
    '/appium/sessions': {
        GET: {
            command: 'getAppiumSessions',
            description: 'Retrieve information about all active Appium sessions. ***Using this command requires enabling Appium\'s [`session_discovery`](https://appium.io/docs/en/latest/reference/cli/insecure-features/) insecure server feature.***',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getappiumsessions',
            parameters: [],
            returns: {
                type: 'Object[]',
                name: 'sessionData',
                description: 'an array of session data objects',
            },
        },
    },
    '/session/:sessionId': {
        GET: {
            command: 'getSession',
            description: 'Retrieve the capabilities of the current session.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#getsession',
            deprecated: 'Use `getAppiumSessionCapabilities` instead. No longer supported since Appium 4.',
            parameters: [],
            returns: {
                type: 'Object',
                name: 'capabilities',
                description: "an object describing the session's capabilities",
            },
        },
    },
    '/session/:sessionId/context': {
        GET: {
            command: 'getAppiumContext',
            description: 'Retrieve the active application context.',
            ref: 'https://appium.io/docs/en/latest/reference/api/mjsonwp/#getcurrentcontext',
            deprecated: 'Use `getCurrentAppiumContext` starting from Appium 3.7',
            parameters: [],
            returns: {
                type: 'string',
                name: 'context',
                description: 'a string representing the current context',
            },
        },
        POST: {
            command: 'switchAppiumContext',
            description: 'Set the active application context.',
            ref: 'https://appium.io/docs/en/latest/reference/api/mjsonwp/#setcontext',
            deprecated: 'Use `setAppiumContext` starting from Appium 3.7',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    description: 'a string representing an available context',
                    required: true,
                },
            ],
        },
    },
    '/session/:sessionId/contexts': {
        GET: {
            command: 'getAppiumContexts',
            description: 'Retrieve all available application contexts.',
            ref: 'https://appium.io/docs/en/latest/reference/api/mjsonwp/#getcontexts',
            deprecated: 'Use `getAppiumProtocolContexts` starting from Appium 3.7',
            parameters: [],
            returns: {
                type: 'string[]',
                name: 'contexts',
                description:
                    "an array of strings representing available contexts, e.g. 'WEBVIEW', or 'NATIVE'",
            },
        },
    },
    '/session/:sessionId/appium/context': {
        GET: {
            command: 'getCurrentAppiumContext',
            description: 'Retrieve the active application context. Requires Appium 3.7 or later.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getcurrentappiumcontext',
            parameters: [],
            returns: {
                type: 'string',
                name: 'context',
                description: 'a string representing the current context',
            },
        },
        POST: {
            command: 'setAppiumContext',
            description: 'Set the active application context. Requires Appium 3.7 or later.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#setappiumcontext',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    description: 'a string representing an available context',
                    required: true,
                },
            ],
        },
    },
    '/session/:sessionId/appium/contexts': {
        GET: {
            command: 'getAppiumProtocolContexts',
            description: 'Retrieve all available application contexts. Requires Appium 3.7 or later.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getappiumcontexts',
            parameters: [],
            returns: {
                type: 'string[]',
                name: 'contexts',
                description:
                    "an array of strings representing available contexts, e.g. 'WEBVIEW', or 'NATIVE'",
            },
        },
    },
    '/session/:sessionId/appium/commands': {
        GET: {
            command: 'getAppiumCommands',
            description: 'Retrieve the endpoints and BiDi commands supported in the current session',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#listcommands',
            parameters: [],
            returns: {
                type: 'Object',
                name: 'commands',
                description:
                    'Supported endpoints and BiDi commands, each grouped into common, driver-specific, and plugin-specific endpoints/commands.',
            },
        },
    },
    '/session/:sessionId/appium/extensions': {
        GET: {
            command: 'getAppiumExtensions',
            description: 'Retrieve the extension commands supported in the current session',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#listextensions',
            parameters: [],
            returns: {
                type: 'Object',
                name: 'commands',
                description:
                    'Supported extension commands, grouped into driver-specific and plugin-specific commands.',
            },
        },
    },
    '/session/:sessionId/appium/capabilities': {
        GET: {
            command: 'getAppiumSessionCapabilities',
            description: 'Retrieve the capabilities of the current session',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getappiumsessioncapabilities',
            parameters: [],
            returns: {
                type: 'Object',
                name: 'capabilities',
                description: "An object describing the session's capabilities.",
            },
        },
    },
    '/session/:sessionId/appium/start_recording_screen': {
        POST: {
            command: 'startRecordingScreen',
            description: 'Start recording the screen.',
            ref: 'https://appium.github.io/appium.io/docs/en/commands/device/recording-screen/start-recording-screen/',
            parameters: [
                {
                    name: 'options',
                    type: 'object',
                    description: 'Appium driver-specific recording options (refer to driver docs)',
                    required: false,
                },
            ],
            returns: {
                type: 'string',
                name: 'response',
                description:
                    'Empty string, or the base64 encoded string of a previous screen recording, if forceRestart and remotePath are not set',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
    },
    '/session/:sessionId/appium/stop_recording_screen': {
        POST: {
            command: 'stopRecordingScreen',
            description: 'Stop recording the screen.',
            ref: 'https://appium.github.io/appium.io/docs/en/commands/device/recording-screen/stop-recording-screen/',
            parameters: [
                {
                    name: 'options',
                    type: 'object',
                    description: 'Appium driver-specific recording options (refer to driver docs)',
                    required: false,
                },
            ],
            returns: {
                type: 'string',
                name: 'response',
                description: 'Base64 encoded string of the screen recording, or an empty string if the remotePath option is set',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
    },
    '/session/:sessionId/rotation': {
        POST: {
            command: 'rotateDevice',
            description: 'Rotate the device in three dimensions.',
            ref: 'https://appium.io/docs/en/latest/reference/api/mjsonwp/#setrotation',
            deprecated: 'Use `setAppiumRotation` starting from Appium 3.7',
            parameters: [
                {
                    name: 'x',
                    type: 'number',
                    description:
                        'x offset to use for the center of the rotate gesture',
                    required: true,
                    default: 0,
                },
                {
                    name: 'y',
                    type: 'number',
                    description:
                        'y offset to use for the center of the rotate gesture',
                    required: true,
                    default: 0,
                },
                {
                    name: 'z',
                    type: 'number',
                    description:
                        'z offset to use for the center of the rotate gesture',
                    required: true,
                    default: 0,
                },
            ],
            support: {
                ios: {
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/rotation': {
        GET: {
            command: 'getAppiumRotation',
            description: 'Get the current spatial orientation of the device. Requires Appium 3.7 or later.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getappiumrotation',
            parameters: [],
            returns: {
                type: 'Object',
                name: 'rotation',
                description: 'Object containing device positional offsets in degrees for the X, Y and Z axis',
            },
        },
        POST: {
            command: 'setAppiumRotation',
            description: 'Rotate the device in three dimensions. Requires Appium 3.7 or later.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#setappiumrotation',
            parameters: [
                {
                    name: 'x',
                    type: 'number',
                    description: 'degrees on the X axis to rotate the device by',
                    required: true,
                },
                {
                    name: 'y',
                    type: 'number',
                    description: 'degrees on the Y axis to rotate the device by',
                    required: true,
                },
                {
                    name: 'z',
                    type: 'number',
                    description: 'degrees on the Z axis to rotate the device by',
                    required: true,
                },
            ],
        },
    },
    '/session/:sessionId/appium/device/install_app': {
        POST: {
            command: 'installApp',
            description: 'Install the given app onto the device.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#installapp',
            parameters: [
                {
                    name: 'appPath',
                    type: 'string',
                    description: 'Path to application .apk file',
                    required: true,
                },
                {
                    name: 'options',
                    type: 'object',
                    description: 'Driver-specific installation options',
                    required: false,
                },
            ],
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/activate_app': {
        POST: {
            command: 'activateApp',
            description: 'Activate the given app on the device',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#activateapp',
            parameters: [
                {
                    name: 'appId',
                    type: 'string',
                    description: 'App package ID (required for Android)',
                    required: false,
                },
                {
                    name: 'bundleId',
                    type: 'string',
                    description: 'Bundle ID (required for iOS)',
                    required: false,
                },
                {
                    name: 'options',
                    type: 'object',
                    description: 'Driver-specific launch options',
                    required: false,
                },
            ],
            support: {
                ios: {
                    XCUITest: '9.3+',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/remove_app': {
        POST: {
            command: 'removeApp',
            description: 'Remove an app from the device.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#removeapp',
            parameters: [
                {
                    name: 'appId',
                    type: 'string',
                    description: 'App package ID (required for Android)',
                    required: false,
                },
                {
                    name: 'bundleId',
                    type: 'string',
                    description: 'Bundle ID (required for iOS)',
                    required: false,
                },
                {
                    name: 'options',
                    type: 'object',
                    description: 'Driver-specific uninstall options',
                    required: false,
                },
            ],
            returns: {
                type: 'boolean',
                name: 'didRemovalSucceed',
                description: 'Return true if uninstall was successful, false if not',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/terminate_app': {
        POST: {
            command: 'terminateApp',
            description: 'Terminate the given app on the device',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#terminateapp',
            parameters: [
                {
                    name: 'appId',
                    type: 'string',
                    description: 'App package ID (required for Android)',
                    required: false,
                },
                {
                    name: 'bundleId',
                    type: 'string',
                    description: 'Bundle ID (required for iOS)',
                    required: false,
                },
                {
                    name: 'options',
                    type: 'object',
                    description: 'Driver-specific termination options',
                    required: false,
                },
            ],
            support: {
                ios: {
                    XCUITest: '9.3+',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/app_installed': {
        POST: {
            command: 'isAppInstalled',
            description: 'Check whether the specified app is installed on the device.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#isappinstalled',
            parameters: [
                {
                    name: 'appId',
                    type: 'string',
                    description: 'App package ID (required for Android)',
                    required: false,
                },
                {
                    name: 'bundleId',
                    type: 'string',
                    description: 'Bundle ID (required for iOS)',
                    required: false,
                },
            ],
            returns: {
                type: 'boolean',
                name: 'isAppInstalled',
                description: 'Return true if installed, false if not',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/app_state': {
        POST: {
            command: 'queryAppState',
            description: 'Get the given app status on the device',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#queryappstate',
            parameters: [
                {
                    name: 'appId',
                    type: 'string',
                    description: 'App package ID (required for Android)',
                    required: false,
                },
                {
                    name: 'bundleId',
                    type: 'string',
                    description: 'Bundle ID (required for iOS)',
                    required: false,
                },
            ],
            returns: {
                type: 'number',
                name: 'appStatus',
                description:
                    '0 is not installed. 1 is not running. 2 is running in background suspended. 3 is running in background. 4 is running in foreground',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/hide_keyboard': {
        POST: {
            command: 'hideKeyboard',
            description: 'Hide soft keyboard.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#hidekeyboard',
            parameters: [
                {
                    name: 'strategy',
                    type: 'string',
                    description:
                        "hide keyboard strategy (UIAutomation only), available strategies - 'press', 'pressKey', 'swipeDown', 'tapOut', 'tapOutside', 'default'",
                    required: false,
                },
                {
                    name: 'key',
                    type: 'string',
                    description: "key value if strategy is 'pressKey'",
                    required: false,
                },
                {
                    name: 'keyCode',
                    type: 'string',
                    description: "key code if strategy is 'pressKey'",
                    required: false,
                },
                {
                    name: 'keyName',
                    type: 'string',
                    description: "key name if strategy is 'pressKey'",
                    required: false,
                },
            ],
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/is_keyboard_shown': {
        GET: {
            command: 'isKeyboardShown',
            description: 'Whether or not the soft keyboard is shown.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#iskeyboardshown',
            parameters: [],
            returns: {
                type: 'boolean',
                name: 'isKeyboardShown',
                description: 'True if the keyboard is shown',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/push_file': {
        POST: {
            command: 'pushFile',
            description: 'Place a file onto the device in a particular place.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#pushfile',
            parameters: [
                {
                    name: 'path',
                    type: 'string',
                    description: 'path to install the data to',
                    required: true,
                },
                {
                    name: 'data',
                    type: 'string',
                    description: 'contents of file in base64',
                    required: true,
                },
            ],
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/pull_file': {
        POST: {
            command: 'pullFile',
            description: "Retrieve a file from the device's file system.",
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#pullfile',
            parameters: [
                {
                    name: 'path',
                    type: 'string',
                    description: 'path on the device to pull file from',
                    required: true,
                },
            ],
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
            returns: {
                type: 'string',
                name: 'response',
                description: 'Contents of file in base64',
            },
        },
    },
    '/session/:sessionId/appium/device/pull_folder': {
        POST: {
            command: 'pullFolder',
            description: "Retrieve a folder from the device's file system.",
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#pullfolder',
            parameters: [
                {
                    name: 'path',
                    type: 'string',
                    description: 'path to an entire folder on the device',
                    required: true,
                },
            ],
            returns: {
                type: 'string',
                name: 'response',
                description: 'Zip file of the folder contents in base64',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/system_time': {
        GET: {
            command: 'getDeviceTime',
            description: 'Get the time on the device.',
            ref: 'https://appium.github.io/appium.io/docs/en/commands/device/system/system-time/',
            parameters: [],
            returns: {
                type: 'string',
                name: 'time',
                description: 'Time on the device',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
            },
        },
        POST: {
            command: 'getFormattedDeviceTime',
            description: 'Get the time on the device in the specified format.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getdevicetime',
            parameters: [
                {
                    name: 'format',
                    type: 'string',
                    description: 'Format to use for the returned timestamp',
                    required: false,
                },
            ],
            returns: {
                type: 'string',
                name: 'time',
                description: 'Time on the device',
            },
        },
    },
    '/session/:sessionId/appium/settings': {
        GET: {
            command: 'getSettings',
            description: 'Retrieve the current session settings.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getsettings',
            parameters: [],
            returns: {
                type: 'object',
                name: 'settings',
                description:
                    'JSON hash of all the currently specified settings, see Settings API',
            },
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
        POST: {
            command: 'updateSettings',
            description: 'Update the session settings.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#updatesettings',
            parameters: [
                {
                    name: 'settings',
                    type: 'object',
                    description: 'key/value object with settings to update',
                    required: true,
                },
            ],
            support: {
                ios: {
                    XCUITest: '9.3+',
                    UIAutomation: '8.0 to 9.3',
                },
                android: {
                    UiAutomator: '4.2+',
                },
                windows: {
                    Windows: '10+',
                },
            },
        },
    },
    '/session/:sessionId/appium/execute_driver': {
        POST: {
            command: 'executeDriverScript',
            description:
                'Execute a script in a child process. This approach helps minimize potential latency associated with each command. ***Using this command requires installing the [`execute-driver`](https://github.com/appium/appium/tree/master/packages/execute-driver-plugin) plugin.***',
            ref: 'https://appium.io/docs/en/latest/reference/api/plugins/#executedriverscript',
            parameters: [
                {
                    name: 'script',
                    type: 'string',
                    description:
                        "The script to execute. It has access to a 'driver' object which represents a WebdriverIO session attached to the current server.",
                    required: true,
                },
                {
                    name: 'type',
                    type: 'string',
                    description:
                        "The language/framework used in the script. Currently, only 'webdriverio' is supported and is the default.",
                    required: false,
                },
                {
                    name: 'timeout',
                    type: 'number',
                    description:
                        'The number of milliseconds the script should be allowed to run before being killed by the Appium server. Defaults to the equivalent of 1 hour.',
                    required: false,
                },
            ],
            returns: {
                type: 'object',
                name: 'result',
                description:
                    "An object containing two fields: 'result', which is the return value of the script itself, and 'logs', which contains 3 inner fields, 'log', 'warn', and 'error', which hold an array of strings logged by console.log, console.warn, and console.error in the script's execution.",
            },
        },
    },
    '/session/:sessionId/appium/events': {
        POST: {
            command: 'getEvents',
            description: 'Get events logged in the current session.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getlogevents',
            parameters: [
                {
                    name: 'type',
                    type: '(string|string[])',
                    description: 'One or more event types to filter the returned events',
                    required: false,
                },
            ],
            returns: {
                type: 'object',
                name: 'result',
                description:
                    "A JSON hash of events like `{'commands' => [{'cmd' => 123455, ....}], 'startTime' => 1572954894127, }`.",
            },
            support: {
                android: {
                    UiAutomator: '4.2+',
                },
                ios: {
                    XCUITest: '9.3+',
                },
            },
        },
    },
    '/session/:sessionId/appium/log_event': {
        POST: {
            command: 'logEvent',
            description: 'Log a custom event.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#logcustomevent',
            parameters: [
                {
                    name: 'vendor',
                    type: 'string',
                    description: 'Name of the namespace (vendor) used to prefix the event',
                    required: true,
                },
                {
                    name: 'event',
                    type: 'string',
                    description: 'Name of the event',
                    required: true,
                },
            ],
            support: {
                android: {
                    UiAutomator: '4.2+',
                },
                ios: {
                    XCUITest: '9.3+',
                },
            },
        },
    },
    '/session/:sessionId/appium/compare_images': {
        POST: {
            command: 'compareImages',
            description:
                'Compare two images using the specified mode of comparison. ***Using this command requires installing the [`images`](https://github.com/appium/appium/tree/master/packages/images-plugin) plugin.***',
            ref: 'https://appium.io/docs/en/latest/reference/api/plugins/#compareimages',
            parameters: [
                {
                    name: 'mode',
                    type: 'string',
                    description:
                        "One of possible comparison modes: 'matchFeatures', 'getSimilarity', 'matchTemplate'.",
                    required: true,
                },
                {
                    name: 'firstImage',
                    type: 'string',
                    description: 'Base64-encoded image file.',
                    required: true,
                },
                {
                    name: 'secondImage',
                    type: 'string',
                    description: 'Base64-encoded image file.',
                    required: true,
                },
                {
                    name: 'options',
                    type: 'object',
                    description:
                        'The supported values of this property depend on the `mode` value. See Appium documentation for more details.',
                    required: false,
                    default: {},
                },
            ],
            returns: {
                type: 'object',
                name: 'result',
                description:
                    'The content of the resulting dictionary depends on the `mode` and `options` values. See Appium documentation for more details.',
            },
        },
    },
    '/appium/storage/add': {
        POST: {
            command: 'addAppiumStorageItem',
            description: 'Add a new file to the Appium storage. ***Using this command requires installing the [`storage`](https://github.com/appium/appium/tree/master/packages/storage-plugin) plugin version 2.0 or later.***',
            ref: 'https://appium.io/docs/en/latest/reference/api/plugins/#addstorageitem',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    description: 'Name used to save the file as',
                    required: true,
                },
                {
                    name: 'sha1',
                    type: 'string',
                    description: 'SHA1 hash of the item to add to the storage',
                    required: true,
                },
            ],
            returns: {
                type: 'object',
                name: 'AddRequestResult',
                description:
                    'an object containing upload-related websocket URLs and their timeout value. See Appium documentation for more details.',
            },
        },
    },
    '/appium/storage/delete': {
        POST: {
            command: 'deleteAppiumStorageItem',
            description: 'Delete a file from the Appium storage. ***Using this command requires installing the [`storage`](https://github.com/appium/appium/tree/master/packages/storage-plugin) plugin version 2.0 or later.***',
            ref: 'https://appium.io/docs/en/latest/reference/api/plugins/#deletestorageitem',
            parameters: [
                {
                    name: 'name',
                    type: 'string',
                    description: 'Name of the file to delete',
                    required: true,
                },
            ],
            returns: {
                type: 'boolean',
                name: 'deletionResult',
                description: 'True if the file was deleted, false otherwise',
            },
        },
    },
    '/appium/storage/list': {
        GET: {
            command: 'listAppiumStorageItems',
            description: 'List all files in the Appium storage. ***Using this command requires installing the [`storage`](https://github.com/appium/appium/tree/master/packages/storage-plugin) plugin version 2.0 or later.***',
            ref: 'https://appium.io/docs/en/latest/reference/api/plugins/#liststorageitems',
            parameters: [],
            returns: {
                type: 'Object[]',
                name: 'StorageItems',
                description: 'an array of metadata objects for each item in the storage. See Appium documentation for more details.',
            },
        },
    },
    '/appium/storage/reset': {
        POST: {
            command: 'resetAppiumStorage',
            description: 'Reset the Appium storage. ***Using this command requires installing the [`storage`](https://github.com/appium/appium/tree/master/packages/storage-plugin) plugin version 2.0 or later.***',
            ref: 'https://appium.io/docs/en/latest/reference/api/plugins/#resetstorage',
            parameters: [],
        },
    },
    '/session/:sessionId/ime/available_engines': {
        GET: {
            command: 'availableIMEEngines',
            description: 'List all available IME engines on the device. To use an engine, it has to be present in this list.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#availableimeengines',
            parameters: [],
            returns: {
                type: 'String[]',
                name: 'engines',
                description: 'A list of available engines',
            },
            support: {
                android: {
                    UiAutomator: '4.2+',
                }
            },
        },
    },
    '/session/:sessionId/ime/active_engine': {
        GET: {
            command: 'getActiveIMEEngine',
            description: 'Get the name of the active IME engine. The name string is platform specific.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#getactiveimeengine',
            parameters: [],
            returns: {
                type: 'String',
                name: 'engine',
                description: 'The name of the active IME engine',
            },
            support: {
                android: {
                    UiAutomator: '4.2+',
                }
            },
        },
    },
    '/session/:sessionId/ime/activated': {
        GET: {
            command: 'isIMEActivated',
            description: 'Indicates whether IME input is active at the moment',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#isimeactivated',
            parameters: [],
            returns: {
                type: 'Boolean',
                name: 'isActive',
                description:
                    'true if IME input is available and currently active, false otherwise',
            },
            support: {
                android: {
                    UiAutomator: '4.2+',
                }
            },
        },
    },
    '/session/:sessionId/ime/deactivate': {
        POST: {
            command: 'deactivateIMEEngine',
            description: 'De-activates the currently-active IME engine.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#deactivateimeengine',
            parameters: [],
            support: {
                android: {
                    UiAutomator: '4.2+',
                }
            },
        },
    },
    '/session/:sessionId/ime/activate': {
        POST: {
            command: 'activateIMEEngine',
            description: 'Activates an IME engine.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#activateimeengine',
            parameters: [
                {
                    name: 'engine',
                    type: 'string',
                    description: 'name of the engine to activate',
                    required: true,
                },
            ],
            support: {
                android: {
                    UiAutomator: '4.2+',
                }
            },
        },
    },
    '/session/:sessionId/orientation': {
        GET: {
            command: 'getOrientation',
            description: 'Get the current device orientation.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#getorientation',
            deprecated: 'Use `getAppiumOrientation` starting from Appium 3.7',
            parameters: [],
            returns: {
                type: 'String',
                name: 'orientation',
                description:
                    'The current orientation corresponding to a value defined in ScreenOrientation: `LANDSCAPE|PORTRAIT`.',
            },
            support: {
                android: {
                    UiAutomator: '4.2+',
                },
                ios: {
                    XCUITest: '9.3+',
                },
            },
        },
        POST: {
            command: 'setOrientation',
            description: 'Set the device orientation',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#setorientation',
            deprecated: 'Use `setAppiumOrientation` starting from Appium 3.7',
            parameters: [
                {
                    name: 'orientation',
                    type: 'string',
                    description:
                        'the new browser orientation as defined in ScreenOrientation: `LANDSCAPE|PORTRAIT`',
                    required: true,
                },
            ],
            support: {
                android: {
                    UiAutomator: '4.2+',
                },
                ios: {
                    XCUITest: '9.3+',
                },
            },
        },
    },
    '/session/:sessionId/appium/device/orientation': {
        GET: {
            command: 'getAppiumOrientation',
            description: 'Get the current device orientation. Requires Appium 3.7 or later.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#getappiumorientation',
            parameters: [],
            returns: {
                type: 'String',
                name: 'orientation',
                description:
                    'The current orientation corresponding to a value defined in ScreenOrientation: `LANDSCAPE|PORTRAIT`.',
            },
        },
        POST: {
            command: 'setAppiumOrientation',
            description: 'Set the device orientation. Requires Appium 3.7 or later.',
            ref: 'https://appium.io/docs/en/latest/reference/api/appium/#setappiumorientation',
            parameters: [
                {
                    name: 'orientation',
                    type: 'string',
                    description:
                        'the new device orientation as defined in ScreenOrientation: `LANDSCAPE|PORTRAIT`',
                    required: true,
                },
            ],
        },
    },
    '/session/:sessionId/location': {
        GET: {
            command: 'getGeoLocation',
            description: 'Get the current geo location.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#getgeolocation',
            deprecated: 'Use driver-specific methods like `driver.execute(\'mobile: getGeolocation\')` or `driver.execute(\'mobile: getSimulatedLocation\')` instead. No longer supported since Appium 4.',
            parameters: [],
            returns: {
                type: 'Object',
                name: 'location',
                description: 'The current geo location.',
            },
        },
        POST: {
            command: 'setGeoLocation',
            description: 'Set the current geo location.',
            ref: 'https://appium.io/docs/en/latest/reference/api/jsonwp/#setgeolocation',
            deprecated: 'Use driver-specific methods like `driver.execute(\'mobile: setGeolocation\', { ... })` or `driver.execute(\'mobile: setSimulatedLocation\', { ... })` instead. No longer supported since Appium 4.',
            parameters: [
                {
                    name: 'location',
                    type: 'object',
                    description:
                        'the new location (`{latitude: number, longitude: number, altitude: number}`)',
                    required: true,
                },
            ],
        },
    },
}
