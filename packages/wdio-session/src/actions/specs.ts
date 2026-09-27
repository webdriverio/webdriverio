import type { Options } from 'yargs'

import { DEFAULT_ACTION_TIMEOUT, DEFAULT_EXEC_TIMEOUT } from '../constants.js'
import type { Applies } from '../types.js'

export interface PositionalSpec {
    name: string
    desc: string
    required?: boolean
    variadic?: boolean
    choices?: string[]
}

export interface ActionSpec {
    name: string
    desc: string
    positionals?: PositionalSpec[]
    options?: Record<string, Options>
    /**
     * platforms the action applies to, `undefined` means all
     */
    applies?: Applies[]
    timeout?: number
    /**
     * runs in the CLI process without contacting a daemon
     */
    local?: boolean
    /**
     * changes the page or app: `--quiet` suppresses its output
     */
    mutation?: boolean
    group: string
    examples?: [string, string][]
}

const target = (desc = 'Ref (e12) or WebdriverIO selector'): PositionalSpec => ({ name: 'target', desc, required: true })

export const OPEN_OPTIONS: Record<string, Options> = {
    replace: { type: 'boolean', desc: 'Close a running session with the same name first' },
    'launch-timeout': { type: 'number', desc: 'Milliseconds to wait for the session to become ready' },
    'idle-timeout': { type: 'string', desc: 'Shut down after this long without requests (e.g. 30m, 0 disables)' },
    capabilities: { type: 'string', desc: 'Extra capabilities as JSON or a path to a JSON file' },
    hostname: { type: 'string', desc: 'Remote WebDriver host' },
    port: { type: 'number', desc: 'Remote WebDriver port' },
    path: { type: 'string', desc: 'Remote WebDriver path' },
    protocol: { type: 'string', desc: 'Remote WebDriver protocol' },
    'log-level': { type: 'string', desc: 'WebdriverIO log level written to daemon.log' },
    bidi: { type: 'boolean', default: true, desc: 'Request WebDriver BiDi (use --no-bidi to disable)' },
    headed: { type: 'boolean', desc: 'Show the browser window' },
    viewport: { type: 'string', desc: 'Initial viewport, e.g. 1280x720' },
    'browser-version': { type: 'string', desc: 'Browser version' },
    binary: { type: 'string', desc: 'Browser binary' },
    arg: { type: 'string', array: true, desc: 'Extra browser argument (repeatable)' },
    profile: { type: 'string', desc: 'Persistent profile directory' },
    attach: { type: 'string', desc: 'Attach to a running Chrome/Edge (debugging port or URL)' },
    app: { type: 'string', desc: 'App file or cloud app URL' },
    package: { type: 'string', desc: 'Android app package' },
    activity: { type: 'string', desc: 'Android app activity' },
    'bundle-id': { type: 'string', desc: 'iOS/macOS bundle id' },
    browser: { type: 'string', desc: 'Mobile web browser (chrome, safari)' },
    device: { type: 'string', desc: 'Device name' },
    'platform-version': { type: 'string', desc: 'Platform version' },
    udid: { type: 'string', desc: 'Device UDID' },
    reset: { type: 'boolean', desc: 'Use --no-reset to keep app state (appium:noReset)' },
    'full-reset': { type: 'boolean', desc: 'appium:fullReset' },
    orientation: { type: 'string', choices: ['portrait', 'landscape'], desc: 'Initial orientation' },
    'appium-url': { type: 'string', desc: 'Use a running Appium server' },
    'app-arg': { type: 'string', array: true, desc: 'Argument passed to a desktop app (repeatable)' },
    chromedriver: { type: 'string', desc: 'Electron: Chromedriver binary' },
    'electron-version': { type: 'string', desc: 'Electron: override version detection' },
    provider: { type: 'string', choices: ['browserstack', 'saucelabs', 'testingbot', 'testmu'], desc: 'Cloud provider' },
    os: { type: 'string', desc: 'Cloud: desktop OS' },
    'os-version': { type: 'string', desc: 'Cloud: desktop OS version' },
    region: { type: 'string', desc: 'Cloud: Sauce Labs region' },
    tunnel: { type: 'string', desc: 'Cloud: start the provider tunnel (or "external")' },
    'tunnel-name': { type: 'string', desc: 'Cloud: tunnel identifier' },
    project: { type: 'string', desc: 'Cloud: project label' },
    build: { type: 'string', desc: 'Cloud: build label' },
    name: { type: 'string', desc: 'Cloud: session name label' }
}

export const ACTIONS: ActionSpec[] = [
    /**
     * lifecycle
     */
    {
        name: 'open', group: 'Lifecycle', local: true,
        desc: 'Start a session: browser, android, ios, macos, windows, electron, tauri, dioxus or a wdio config file',
        positionals: [
            { name: 'target', desc: 'chrome | firefox | edge | safari | android | ios | macos | windows | electron <app> | tauri <app> | dioxus <app> | <wdio.conf>', required: true },
            { name: 'url', desc: 'URL to open (browsers), app path (desktop apps) or capability (config)' }
        ],
        options: OPEN_OPTIONS,
        examples: [
            ['$0 session open chrome http://localhost:3000', 'Open headless Chrome'],
            ['$0 session open android --app ./app.apk', 'Open an Android app through Appium'],
            ['$0 session open electron ./main.js', 'Open an Electron app'],
            ['$0 session open ./wdio.conf.ts 0', 'Open the first capability of a config']
        ]
    },
    { name: 'close', group: 'Lifecycle', desc: 'End the session and stop its daemon', local: true, options: { all: { type: 'boolean', desc: 'Close every session' }, clean: { type: 'boolean', desc: 'Also delete the artifacts dir' } } },
    { name: 'list', group: 'Lifecycle', desc: 'List running sessions', local: true },
    { name: 'info', group: 'Lifecycle', desc: 'Show session details' },
    { name: 'restart', group: 'Lifecycle', desc: 'Close and re-open with the same target and flags', local: true },
    { name: 'status', group: 'Lifecycle', desc: 'Exit 0 if the session is running, 4 if not', local: true },

    /**
     * code
     */
    {
        name: 'exec', group: 'Code', timeout: DEFAULT_EXEC_TIMEOUT, mutation: false,
        desc: 'Run WebdriverIO code from stdin, -e or a file',
        positionals: [{ name: 'file', desc: 'Script file (.js, .ts, .mjs)' }],
        options: {
            e: { type: 'string', alias: 'eval', desc: 'Code to run' },
            history: { type: 'boolean', default: true, desc: 'Record the code in the history (use --no-history to skip)' }
        },
        examples: [
            ['$0 session exec -e "await browser.getTitle()"', 'Run a one-liner'],
            ['$0 session <<\'JS\'\nawait $(\'aria/Sign in\').click()\nJS', 'Pipe code on stdin']
        ]
    },
    { name: 'helpers', group: 'Code', desc: 'List project helpers from .wdio/helpers', options: { reload: { type: 'boolean', desc: 'Re-import the helpers' } } },

    /**
     * observation
     */
    {
        name: 'snapshot', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Accessibility snapshot with refs',
        options: {
            depth: { type: 'number', desc: 'Maximum depth' },
            scope: { type: 'string', desc: 'Only snapshot below this target' },
            interactive: { type: 'boolean', alias: 'i', desc: 'Only interactive elements' },
            all: { type: 'boolean', desc: 'Include hidden elements' },
            boxes: { type: 'boolean', desc: 'Append bounding boxes' },
            'file-only': { type: 'boolean', desc: 'Only write the file' },
            'max-chars': { type: 'number', desc: 'Print inline up to this many characters (default 8000)' }
        }
    },
    {
        name: 'find', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Search a fresh snapshot for text',
        positionals: [{ name: 'text', desc: 'Text to search for', required: true }],
        options: { regex: { type: 'boolean', desc: 'Treat text as a regular expression' }, context: { type: 'number', desc: 'Lines of context (default 2)' } }
    },
    { name: 'diff', group: 'Observation', applies: ['W', 'M', 'D'], desc: 'Diff a fresh snapshot against the previous one', options: { baseline: { type: 'string', desc: 'Snapshot file to compare with' } } },
    {
        name: 'screenshot', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Save a PNG of the viewport, an element or the full page',
        positionals: [{ name: 'target', desc: 'Element to capture' }],
        options: { full: { type: 'boolean', desc: 'Full page (web)' }, path: { type: 'string', desc: 'Output file' } }
    },
    { name: 'source', group: 'Observation', applies: ['W', 'M', 'D'], desc: 'Save the page HTML or app XML', options: { path: { type: 'string', desc: 'Output file' } } },
    {
        name: 'get', group: 'Observation', applies: ['W'],
        desc: 'Read text, html, value, an attribute, the title, the URL, a count or a box',
        positionals: [
            { name: 'sub', desc: 'text | html | value | attr | title | url | count | box', required: true, choices: ['text', 'html', 'value', 'attr', 'title', 'url', 'count', 'box'] },
            { name: 'target', desc: 'Ref or selector (not used for title and url)' },
            { name: 'name', desc: 'Attribute name (attr only)' }
        ],
        examples: [
            ['$0 session get text e1', 'Text of a ref'],
            ['$0 session get url', 'Current URL'],
            ['$0 session get attr e3 href', 'href of a link']
        ]
    },
    {
        name: 'is', group: 'Observation', applies: ['W'],
        desc: 'Check whether an element is visible, enabled or checked',
        positionals: [
            { name: 'sub', desc: 'visible | enabled | checked', required: true, choices: ['visible', 'enabled', 'checked'] },
            { name: 'target', desc: 'Ref or selector', required: true }
        ],
        examples: [['$0 session is visible e1', 'Print true or false']]
    },
    {
        name: 'logs', group: 'Observation', applies: ['W', 'M'],
        desc: 'Print console, page error, network and device logs since the last call',
        options: {
            errors: { type: 'boolean', desc: 'Only errors' },
            network: { type: 'boolean', desc: 'Only network entries' },
            since: { type: 'string', desc: 'Only entries newer than this duration (e.g. 30s)' },
            peek: { type: 'boolean', desc: 'Do not advance the read cursor' },
            source: { type: 'string', choices: ['browser', 'driver', 'logcat', 'syslog', 'main'], desc: 'Log source' }
        }
    },

    /**
     * interaction shortcuts
     */
    { name: 'navigate', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Open a URL', positionals: [{ name: 'url', desc: 'URL (relative URLs use baseUrl)', required: true }] },
    { name: 'back', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Go back' },
    { name: 'forward', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Go forward' },
    { name: 'reload', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Reload the page' },
    { name: 'click', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true, desc: 'Click an element', positionals: [target()], options: { double: { type: 'boolean', desc: 'Double click' }, right: { type: 'boolean', desc: 'Right click' } } },
    { name: 'tap', group: 'Interaction', applies: ['M'], mutation: true, desc: 'Tap an element (mobile)', positionals: [target()] },
    { name: 'fill', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true, desc: 'Replace the value of an input', positionals: [target(), { name: 'text', desc: 'Text', required: true }] },
    { name: 'type', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true, desc: 'Type into the focused element', positionals: [{ name: 'text', desc: 'Text', required: true }] },
    { name: 'press', group: 'Interaction', applies: ['W', 'D'], mutation: true, desc: 'Press keys, e.g. Enter, Control+a', positionals: [{ name: 'keys', desc: 'Key combination', required: true }] },
    {
        name: 'select', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Select an option of a <select>',
        positionals: [target(), { name: 'value', desc: 'Option text, value or index', required: true }],
        options: { by: { type: 'string', choices: ['text', 'value', 'index'], desc: 'How to match the option (default text)' } }
    },
    { name: 'upload', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Set a file input', positionals: [target(), { name: 'file', desc: 'File to upload', required: true }] },
    { name: 'hover', group: 'Interaction', applies: ['W', 'D'], mutation: true, desc: 'Move the pointer over an element', positionals: [target()] },
    { name: 'drag', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true, desc: 'Drag an element onto another', positionals: [{ name: 'from', desc: 'Source', required: true }, { name: 'to', desc: 'Destination', required: true }] },
    { name: 'scroll', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Scroll an element into view or the page', positionals: [{ name: 'target', desc: 'Ref, selector, up, down, top or bottom' }], options: { px: { type: 'number', desc: 'Pixels for up/down (default 600)' } } },
    { name: 'swipe', group: 'Interaction', applies: ['M'], mutation: true, desc: 'Swipe the screen (mobile)', positionals: [{ name: 'direction', desc: 'Direction', required: true, choices: ['up', 'down', 'left', 'right'] }], options: { percent: { type: 'number', desc: 'Swipe length 0..1' } } },
    { name: 'long-press', group: 'Interaction', applies: ['M'], mutation: true, desc: 'Long press an element (mobile)', positionals: [target()], options: { duration: { type: 'number', desc: 'Milliseconds' } } },

    /**
     * contexts
     */
    { name: 'tabs', group: 'Contexts', applies: ['W'], desc: 'List, open, switch or close tabs', positionals: [{ name: 'sub', desc: 'switch | new | close', choices: ['switch', 'new', 'close'] }, { name: 'arg', desc: 'Index, handle or URL' }] },
    { name: 'windows', group: 'Contexts', applies: ['W', 'D'], desc: 'List or switch windows', positionals: [{ name: 'sub', desc: 'switch', choices: ['switch'] }, { name: 'arg', desc: 'Index or handle' }] },
    { name: 'frame', group: 'Contexts', applies: ['W'], mutation: true, desc: 'Switch into an iframe, to the parent or to the top', positionals: [{ name: 'target', desc: 'Ref, selector, parent or top', required: true }] },
    { name: 'contexts', group: 'Contexts', applies: ['M'], desc: 'List or switch native/webview contexts', positionals: [{ name: 'sub', desc: 'switch', choices: ['switch'] }, { name: 'name', desc: 'Context name' }] },
    { name: 'dialog', group: 'Contexts', applies: ['W', 'M'], mutation: true, desc: 'Accept or dismiss an open dialog', positionals: [{ name: 'sub', desc: 'accept | dismiss', required: true, choices: ['accept', 'dismiss'] }], options: { text: { type: 'string', desc: 'Prompt text' } } },

    /**
     * device
     */
    { name: 'app', group: 'Device', applies: ['M', 'D'], mutation: true, desc: 'Launch, terminate, install or query an app', positionals: [{ name: 'sub', desc: 'launch | terminate | install | state', required: true, choices: ['launch', 'terminate', 'install', 'state'] }, { name: 'id', desc: 'App id, bundle id or file', required: true }] },
    { name: 'deeplink', group: 'Device', applies: ['M'], mutation: true, desc: 'Open a deep link', positionals: [{ name: 'url', desc: 'URL', required: true }], options: { package: { type: 'string', desc: 'Android package or iOS bundle id' } } },
    { name: 'rotate', group: 'Device', applies: ['M'], mutation: true, desc: 'Rotate the device', positionals: [{ name: 'orientation', desc: 'portrait | landscape', required: true, choices: ['portrait', 'landscape'] }] },
    { name: 'keyboard', group: 'Device', applies: ['M'], mutation: true, desc: 'Hide the on-screen keyboard', positionals: [{ name: 'sub', desc: 'hide', required: true, choices: ['hide'] }] },
    { name: 'background', group: 'Device', applies: ['M'], mutation: true, desc: 'Send the app to the background', positionals: [{ name: 'seconds', desc: 'Seconds (-1 keeps it there)', required: true }] },
    { name: 'lock', group: 'Device', applies: ['M'], mutation: true, desc: 'Lock the device' },
    { name: 'unlock', group: 'Device', applies: ['M'], mutation: true, desc: 'Unlock the device' },
    { name: 'geolocation', group: 'Device', applies: ['W', 'M'], mutation: true, desc: 'Set the geolocation', positionals: [{ name: 'lat', desc: 'Latitude', required: true }, { name: 'lon', desc: 'Longitude', required: true }], options: { accuracy: { type: 'number', desc: 'Accuracy in meters' } } },

    /**
     * emulation
     */
    {
        name: 'emulate', group: 'Emulation', applies: ['W'], mutation: true,
        desc: 'Emulate a device, viewport, network, cpu, clock, color scheme or user agent',
        positionals: [
            { name: 'sub', desc: 'device | viewport | network | cpu | clock | color-scheme | user-agent | reset', required: true, choices: ['device', 'viewport', 'network', 'cpu', 'clock', 'color-scheme', 'user-agent', 'reset'] },
            { name: 'value', desc: 'Value for the emulation' }
        ],
        options: { dpr: { type: 'number', desc: 'Device pixel ratio (viewport)' }, tick: { type: 'number', desc: 'Advance the emulated clock by ms' } }
    },

    /**
     * network
     */
    {
        name: 'requests', group: 'Network', applies: ['W'],
        desc: 'List captured network requests (BiDi)',
        options: {
            filter: { type: 'string', desc: 'Substring or glob' },
            failed: { type: 'boolean', desc: 'Only failed requests' },
            since: { type: 'string', desc: 'Only requests newer than this duration' },
            limit: { type: 'number', desc: 'Maximum lines (default 50)' }
        }
    },
    {
        name: 'mock', group: 'Network', applies: ['W'], mutation: true,
        desc: 'Mock responses for a URL pattern (BiDi)',
        positionals: [{ name: 'pattern', desc: 'URL pattern', required: true }],
        options: {
            status: { type: 'number', desc: 'Status code' },
            body: { type: 'string', desc: 'Body as JSON/text or a file path' },
            header: { type: 'string', array: true, desc: 'Header k:v (repeatable)' },
            abort: { type: 'boolean', desc: 'Abort matching requests' },
            method: { type: 'string', desc: 'Only this method' },
            once: { type: 'boolean', desc: 'Only the next request' }
        }
    },
    { name: 'unmock', group: 'Network', applies: ['W'], mutation: true, desc: 'Remove mocks', positionals: [{ name: 'pattern', desc: 'Pattern or mock id' }], options: { all: { type: 'boolean', desc: 'Remove all mocks' } } },

    /**
     * state
     */
    {
        name: 'cookies', group: 'State', applies: ['W'],
        desc: 'Get, set or clear cookies',
        positionals: [{ name: 'sub', desc: 'get | set | clear', choices: ['get', 'set', 'clear'] }, { name: 'name', desc: 'Cookie name' }, { name: 'value', desc: 'Cookie value' }],
        options: {
            domain: { type: 'string' }, path: { type: 'string', desc: 'Cookie path' }, 'http-only': { type: 'boolean' },
            secure: { type: 'boolean' }, 'same-site': { type: 'string' }, expiry: { type: 'number' }
        }
    },
    {
        name: 'storage', group: 'State', applies: ['W'],
        desc: 'Get, set or clear localStorage (or sessionStorage)',
        positionals: [{ name: 'sub', desc: 'get | set | clear', choices: ['get', 'set', 'clear'] }, { name: 'key', desc: 'Key' }, { name: 'value', desc: 'Value' }],
        options: { 'session-storage': { type: 'boolean', desc: 'Use sessionStorage' } }
    },
    { name: 'state', group: 'State', applies: ['W'], mutation: true, desc: 'Save or load cookies and storage', positionals: [{ name: 'sub', desc: 'save | load', required: true, choices: ['save', 'load'] }, { name: 'file', desc: 'State file', required: true }] },

    /**
     * visual
     */
    {
        name: 'visual', group: 'Visual', applies: ['W', 'M', 'D'],
        desc: 'Visual snapshots through @wdio/visual-service',
        positionals: [{ name: 'sub', desc: 'save | check | accept | list', required: true, choices: ['save', 'check', 'accept', 'list'] }, { name: 'tag', desc: 'Image tag' }],
        options: {
            element: { type: 'string', desc: 'Only this element' },
            full: { type: 'boolean', desc: 'Full page' },
            tabbable: { type: 'boolean', desc: 'Tabbable page' },
            threshold: { type: 'number', desc: 'Allowed mismatch in percent (default 0)' },
            all: { type: 'boolean', desc: 'accept: every tag' }
        }
    },

    /**
     * evidence
     */
    { name: 'trace', group: 'Evidence', desc: 'Record every step with screenshots and snapshots', positionals: [{ name: 'sub', desc: 'start | stop', required: true, choices: ['start', 'stop'] }], options: { screenshots: { type: 'boolean', default: true }, snapshots: { type: 'boolean', default: true } } },
    { name: 'record', group: 'Evidence', applies: ['W', 'M'], desc: 'Record a video', positionals: [{ name: 'sub', desc: 'start | stop', required: true, choices: ['start', 'stop'] }], options: { fps: { type: 'number', desc: 'Frames per second (default 5)' }, path: { type: 'string', desc: 'Output file' } } },
    { name: 'history', group: 'Evidence', desc: 'Print the recorded steps', options: { clear: { type: 'boolean', desc: 'Clear the history' } } },
    {
        name: 'export', group: 'Evidence',
        desc: 'Generate a spec from the history',
        options: {
            out: { type: 'string', desc: 'Output file' },
            title: { type: 'string', desc: 'Suite title' },
            'page-objects': { type: 'boolean', desc: 'Generate page objects' },
            framework: { type: 'string', choices: ['mocha', 'jasmine'], desc: 'Framework (default mocha)' }
        }
    },

    /**
     * bridge and tooling
     */
    { name: 'resume', group: 'Tooling', desc: 'Continue a test paused by wdio run --debug=agent' },
    { name: 'doctor', group: 'Tooling', local: true, desc: 'Check your environment', positionals: [{ name: 'target', desc: 'Only check what this target needs' }] },
    { name: 'skill', group: 'Tooling', local: true, desc: 'Print the agent skill', options: { install: { type: 'string', desc: 'Write it to .agents/skills/wdio-session/SKILL.md (or this dir)' } } }
]

export const ACTION_MAP = new Map(ACTIONS.map((a) => [a.name, a]))

export function actionTimeout (name: string) {
    return ACTION_MAP.get(name)?.timeout ?? DEFAULT_ACTION_TIMEOUT
}
