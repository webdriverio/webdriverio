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
    /**
     * what the action prints and what to know before using it, shown by
     * `--help` and in the docs. Lines are paragraphs.
     */
    details?: string
    /**
     * `[command, description]` pairs. Commands are full shell lines that
     * start with `wdio session` and may chain actions with `&&`.
     */
    examples: [string, string][]
    seeAlso?: string[]
}

/**
 * `--quiet` hides mutation output. A read inside a mutating command, such
 * as `dialog status`, still has to print.
 */
export function actionIsMutation (spec: ActionSpec, argv: Record<string, unknown>) {
    if (spec.name === 'dialog' && argv.sub === 'status') {
        return false
    }
    return Boolean(spec.mutation)
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
    headless: { type: 'boolean', desc: 'Run without a window (the default for browsers; overrides --headed)' },
    snapshot: { type: 'boolean', default: true, desc: 'Print the interactive snapshot of the opened page (use --no-snapshot to skip)' },
    viewport: { type: 'string', desc: 'Initial viewport, e.g. 1280x720' },
    'browser-version': { type: 'string', desc: 'Browser version' },
    binary: { type: 'string', desc: 'Browser binary' },
    arg: { type: 'string', array: true, desc: 'Extra browser argument. A value that starts with `-` needs `=`, e.g. `--arg=--disable-gpu`' },
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
    'app-arg': { type: 'string', array: true, desc: 'Argument passed to a desktop app. A value that starts with `-` needs `=`, e.g. `--app-arg=--no-sandbox`' },
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
        details: [
            'Starts a background daemon that keeps the session alive until `close`, or until it was idle for --idle-timeout (default 30m). Browsers run headless unless you pass --headed. Prints the session name, the target, the artifacts directory where snapshots, screenshots and exports go, and for a browser opened on a URL the interactive snapshot of that page.',
            'One session per name. Opening a name that is already running fails; use it, close it, or pass --replace. Pass `-s <name>` only when you need two sessions at once.'
        ].join('\n'),
        positionals: [
            { name: 'target', desc: 'chrome | firefox | edge | safari | android | ios | macos | windows | electron <app> | tauri <app> | dioxus <app> | <wdio.conf>', required: true },
            { name: 'url', desc: 'URL to open (browsers), app path (desktop apps) or capability (config)' }
        ],
        options: OPEN_OPTIONS,
        examples: [
            ['wdio session open chrome http://localhost:3000', 'Open headless Chrome on a local app'],
            ['wdio session open firefox http://localhost:3000 --headed', 'Open Firefox with a visible window'],
            ['wdio session open android --app ./app.apk', 'Open an Android app through Appium'],
            ['wdio session open ios --bundle-id com.example.shop', 'Open an installed iOS app'],
            ['wdio session open electron ./main.js', 'Open an Electron app'],
            ['wdio session open ./wdio.conf.ts 0', 'Open the first capability of a config'],
            ['wdio session open chrome https://example.com --provider browserstack', 'Open Chrome in a cloud grid']
        ],
        seeAlso: ['snapshot', 'close', 'doctor']
    },
    {
        name: 'close', group: 'Lifecycle', local: true,
        desc: 'End the session and stop its daemon',
        details: 'On a session opened by `wdio run --debug=agent` this fails the paused test; use `resume` to let it continue.',
        options: { all: { type: 'boolean', desc: 'Close every session' }, clean: { type: 'boolean', desc: 'Also delete the artifacts dir' } },
        examples: [
            ['wdio session close', 'Close the default session'],
            ['wdio session close --all --clean', 'Close every session and delete their artifacts']
        ],
        seeAlso: ['open', 'list']
    },
    {
        name: 'list', group: 'Lifecycle', local: true,
        desc: 'List running sessions',
        details: 'Prints one line per session: name, target, URL and age. Removes state left behind by sessions that died.',
        examples: [['wdio session list', 'Show every running session']],
        seeAlso: ['info', 'status']
    },
    {
        name: 'info', group: 'Lifecycle',
        desc: 'Show session details',
        details: 'Prints the target, browser and version, BiDi support, artifacts directory, and the current URL, title, window size and frame (web) or context and activity (mobile).',
        examples: [['wdio session info', 'Show where the session is and what it runs']],
        seeAlso: ['list', 'get']
    },
    {
        name: 'restart', group: 'Lifecycle', local: true,
        desc: 'Close and re-open with the same target and flags',
        details: 'Keeps the recorded history, so `export` still covers the steps from before the restart.',
        examples: [['wdio session restart', 'Start over with a fresh browser']],
        seeAlso: ['open', 'close']
    },
    {
        name: 'status', group: 'Lifecycle', local: true,
        desc: 'Exit 0 if the session is running, 4 if not',
        examples: [['wdio session status || wdio session open chrome http://localhost:3000', 'Open a session only when none is running']],
        seeAlso: ['list', 'open']
    },

    /**
     * code
     */
    {
        name: 'exec', group: 'Code', timeout: DEFAULT_EXEC_TIMEOUT, mutation: false,
        desc: 'Run WebdriverIO code from stdin, -e or a file',
        details: [
            'Runs as an async function with `browser`, `$`, `$$`, `expect` and `ref(\'e3\')` in scope. Top-level variables persist between calls. `wdio session` without an action runs `exec` when code is piped on stdin.',
            'Always `await` commands. `$` returns exactly one element and throws StrictSelectorError when more than one matches. Prefer a single action (click, fill, …) when one does the job; use `exec` for loops, conditions and assertions.'
        ].join('\n'),
        positionals: [{ name: 'file', desc: 'Script file (.js, .ts, .mjs)' }],
        options: {
            e: { type: 'string', alias: 'eval', desc: 'Code to run' },
            history: { type: 'boolean', default: true, desc: 'Record the code in the history (use --no-history to skip)' }
        },
        examples: [
            ['wdio session exec -e "await browser.getTitle()"', 'Run a one-liner'],
            ['wdio session exec -e \'await expect($("h1")).toHaveText("Cart")\'', 'Assert on the page (single quotes keep the shell away from $)'],
            ['wdio session <<\'JS\'\nawait $(\'aria/Sign in\').click()\nawait expect(browser).toHaveUrl(expect.stringContaining(\'/dashboard\'))\nJS', 'Pipe several steps on stdin'],
            ['wdio session exec ./scripts/login.ts', 'Run a script file']
        ],
        seeAlso: ['helpers', 'history', 'export']
    },
    {
        name: 'helpers', group: 'Code',
        desc: 'List project helpers from .wdio/helpers',
        details: 'Each file under .wdio/helpers default-exports a function that receives the browser and registers custom commands with addCommand. Helpers load when the session opens, and they become custom commands in the exported test.',
        options: { reload: { type: 'boolean', desc: 'Re-import the helpers' } },
        examples: [
            ['wdio session helpers', 'List helpers and the commands they add'],
            ['wdio session helpers --reload', 'Pick up edits to a helper']
        ],
        seeAlso: ['exec', 'export']
    },

    /**
     * observation
     */
    {
        name: 'snapshot', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Accessibility snapshot with refs',
        details: [
            'Prints the accessibility tree, one node per line, e.g. `button "Add to cart" [ref=e3]`. Pass a ref to click, fill, get and the other actions. Refs stay valid while the element exists; an action on a removed element fails with REF_STALE.',
            'Every snapshot is written to the artifacts dir. Output longer than --max-chars is not printed; you get the file path and a hint to narrow it with --interactive, --depth, --scope or `find`.',
            'The text layout and the --json shape are experimental and may change in a minor release. The ref syntax and the actions that take a ref stay stable.'
        ].join('\n'),
        options: {
            depth: { type: 'number', desc: 'Maximum depth' },
            scope: { type: 'string', desc: 'Only snapshot below this ref or selector' },
            interactive: { type: 'boolean', alias: 'i', desc: 'Only interactive elements' },
            all: { type: 'boolean', desc: 'Include hidden elements' },
            boxes: { type: 'boolean', desc: 'Append bounding boxes' },
            compact: { type: 'boolean', desc: 'Drop unnamed nodes that have no content' },
            urls: { type: 'boolean', alias: 'u', desc: 'Include link hrefs' },
            'file-only': { type: 'boolean', desc: 'Only write the file' },
            'max-chars': { type: 'number', desc: 'Print inline up to this many characters (default 8000)' }
        },
        examples: [
            ['wdio session snapshot -i', 'Interactive elements only, the usual first look'],
            ['wdio session snapshot --compact --urls', 'Whole page with link targets'],
            ['wdio session snapshot --scope "#checkout" --depth 4', 'Only part of the page'],
            ['wdio session click e3 && wdio session snapshot -i', 'Act, then look again']
        ],
        seeAlso: ['find', 'diff', 'screenshot']
    },
    {
        name: 'find', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Search a fresh snapshot for text',
        details: 'Takes a new snapshot and prints each match with the node around it (e.g. the whole list item, so a value next to the match is included), with line numbers and refs. Matching ignores case. Cheaper than reading a whole snapshot of a large page. -A/-B/-C print plain line context instead, like grep.',
        positionals: [{ name: 'text', desc: 'Text to search for', required: true }],
        options: {
            regex: { type: 'boolean', desc: 'Treat text as a regular expression' },
            context: { type: 'number', alias: 'C', desc: 'Lines of context before and after instead of the surrounding node' },
            'after-context': { type: 'number', alias: 'A', desc: 'Lines of context after each match' },
            'before-context': { type: 'number', alias: 'B', desc: 'Lines of context before each match' }
        },
        examples: [
            ['wdio session find "Add to cart"', 'Find the ref of a button'],
            ['wdio session find "^\\s*link" --regex --context 0', 'List every link']
        ],
        seeAlso: ['snapshot', 'wait']
    },
    {
        name: 'diff', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Diff a fresh snapshot against the previous one',
        details: 'Prints a unified diff of what changed since the last snapshot, or "No changes". The first call stores a baseline. Use it after an action to see what the action did without reading the whole page again.',
        options: {
            baseline: { type: 'string', desc: 'Snapshot file to compare with' },
            scope: { type: 'string', desc: 'Only snapshot within this ref or selector, like `snapshot --scope`' },
            interactive: { type: 'boolean', desc: 'Only interactive elements, like `snapshot -i`' }
        },
        examples: [
            ['wdio session click e7 && wdio session diff', 'See what a click changed'],
            ['wdio session diff --baseline before.yml', 'Compare with a saved snapshot']
        ],
        seeAlso: ['snapshot', 'find']
    },
    {
        name: 'screenshot', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Save a PNG of the viewport, an element or the full page',
        details: 'Prints the file path and the image size. Take a screenshot when the question is about layout or looks; read text and state with `snapshot` and `get`.',
        positionals: [{ name: 'target', desc: 'Ref or selector of the element to capture' }],
        options: { full: { type: 'boolean', desc: 'Full page (web)' }, path: { type: 'string', desc: 'Output file' } },
        examples: [
            ['wdio session screenshot', 'Capture the viewport'],
            ['wdio session screenshot e5 --path card.png', 'Capture one element'],
            ['wdio session screenshot --full', 'Capture the whole page']
        ],
        seeAlso: ['visual', 'pdf', 'snapshot']
    },
    {
        name: 'pdf', group: 'Observation', applies: ['W'],
        desc: 'Save the current page as a PDF',
        details: 'Calls `browser.savePDF`. A BiDi session prints with `browsingContext.print`, headed or headless, in Chrome, Edge and Firefox. A Classic session uses `printPage`, which older Chrome only supports headless.',
        positionals: [{ name: 'file', desc: 'Output file (must end in .pdf)' }],
        options: { path: { type: 'string', desc: 'Output file (must end in .pdf)' } },
        examples: [['wdio session pdf report.pdf', 'Write report.pdf in the current directory']],
        seeAlso: ['screenshot']
    },
    {
        name: 'source', group: 'Observation', applies: ['W', 'M', 'D'],
        desc: 'Save the page HTML or app XML',
        details: 'Writes the file and prints its path and size. Use it when a snapshot hides what you need, such as attributes for a selector.',
        options: { path: { type: 'string', desc: 'Output file' } },
        examples: [['wdio session source --path page.html', 'Save the HTML next to you']],
        seeAlso: ['snapshot', 'get']
    },
    {
        name: 'get', group: 'Observation', applies: ['W'],
        desc: 'Read text, html, value, an attribute, the title, the URL, a count or a box',
        details: 'Prints the value, then the WebdriverIO code it ran (`→ …`). Pass -q to print only the value, e.g. to capture it in a shell variable. Read a value before you write an assertion for it.',
        positionals: [
            { name: 'sub', desc: 'text | html | value | attr | title | url | count | box', required: true, choices: ['text', 'html', 'value', 'attr', 'title', 'url', 'count', 'box'] },
            { name: 'target', desc: 'Ref or selector (not used for title and url)' },
            { name: 'name', desc: 'Attribute name (attr only)' }
        ],
        examples: [
            ['wdio session get text e1', 'Text of a ref'],
            ['wdio session get url', 'Current URL'],
            ['url=$(wdio session get url -q)', 'Only the value, for a shell variable'],
            ['wdio session get attr e3 href', 'href of a link'],
            ['wdio session get count "aria/Remove"', 'How many elements match']
        ],
        seeAlso: ['is', 'wait', 'exec']
    },
    {
        name: 'is', group: 'Observation', applies: ['W'],
        desc: 'Check whether an element is visible, enabled or checked',
        details: 'Prints true or false, then the WebdriverIO code it ran; pass -q to print only the value. The exit code is 0 either way.',
        positionals: [
            { name: 'sub', desc: 'visible | enabled | checked', required: true, choices: ['visible', 'enabled', 'checked'] },
            { name: 'target', desc: 'Ref or selector', required: true }
        ],
        examples: [
            ['wdio session is visible e1', 'Print true or false'],
            ['wdio session is enabled "aria/Place order"', 'Check a button by its label']
        ],
        seeAlso: ['get', 'wait']
    },
    {
        name: 'logs', group: 'Observation', applies: ['W', 'M'],
        desc: 'Print console, page error, network and device logs since the last call',
        details: 'Each call advances a read cursor, so the next call only shows new entries. Run it after an action to see the errors that action caused.',
        options: {
            errors: { type: 'boolean', desc: 'Only errors' },
            network: { type: 'boolean', desc: 'Only network entries' },
            since: { type: 'string', desc: 'Only entries newer than this duration (e.g. 30s)' },
            peek: { type: 'boolean', desc: 'Do not advance the read cursor' },
            source: { type: 'string', choices: ['browser', 'driver', 'logcat', 'syslog', 'main'], desc: 'Log source' }
        },
        examples: [
            ['wdio session click e4 && wdio session logs --errors', 'Errors caused by a click'],
            ['wdio session logs --since 30s --peek', 'Recent entries, keep them for the next call']
        ],
        seeAlso: ['requests']
    },

    /**
     * interaction shortcuts
     */
    {
        name: 'navigate', group: 'Interaction', applies: ['W'], mutation: true,
        desc: 'Open a URL',
        details: 'Accepts `example.com`, full URLs and paths relative to baseUrl. Leaves any frame first. Prints the new URL and title.',
        positionals: [{ name: 'url', desc: 'URL (relative URLs use baseUrl)', required: true }],
        examples: [
            ['wdio session navigate /cart && wdio session snapshot -i', 'Go to a page and look at it'],
            ['wdio session navigate example.com', 'Open another site']
        ],
        seeAlso: ['back', 'reload', 'wait']
    },
    { name: 'back', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Go back', examples: [['wdio session back', 'Go back one page']], seeAlso: ['forward', 'navigate'] },
    { name: 'forward', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Go forward', examples: [['wdio session forward', 'Go forward one page']], seeAlso: ['back', 'navigate'] },
    { name: 'reload', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Reload the page', examples: [['wdio session reload && wdio session wait --load networkidle', 'Reload and wait until the network is quiet']], seeAlso: ['navigate', 'wait'] },
    {
        name: 'wait', group: 'Interaction', applies: ['W'],
        desc: 'Wait for an element, text, a URL, a load state, a condition or a few milliseconds',
        details: [
            'Pass exactly one of: a ref or selector, --text, --url, --load, --fn, or milliseconds. Fails with exit code 1 after --limit.',
            'Prefer a condition over a pause, both here and over `sleep` in a chain. A pause longer than 30 seconds is refused.'
        ].join('\n'),
        timeout: 120_000,
        positionals: [{ name: 'target', desc: 'Ref, selector or milliseconds' }],
        options: {
            text: { type: 'string', desc: 'Wait until the page contains this text' },
            url: { type: 'string', desc: 'Wait until the URL matches (substring, or * and ** globs)' },
            load: { type: 'string', desc: 'domcontentloaded, load or networkidle' },
            fn: { type: 'string', desc: 'Wait until this JavaScript expression is true' },
            state: { type: 'string', desc: 'With a target: visible (default), hidden, enabled or disabled' },
            limit: { type: 'number', desc: 'Milliseconds to wait (default 10000)' }
        },
        examples: [
            ['wdio session wait e1', 'Wait until a ref is visible'],
            ['wdio session wait "aria/Loading" --state hidden', 'Wait until a spinner is gone'],
            ['wdio session click e3 && wdio session wait --text "Cart (1)" && wdio session snapshot -i', 'Act, wait for the result, look again'],
            ['wdio session wait --url "**/dashboard"', 'Wait for a URL'],
            ['wdio session wait --load networkidle', 'Wait until no request is in flight'],
            ['wdio session wait 500', 'Pause 500ms']
        ],
        seeAlso: ['find', 'is', 'get']
    },
    {
        name: 'click', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true,
        desc: 'Click an element',
        details: 'Prints what was clicked and, when the click navigated, the new URL. Take a new snapshot before you use refs on the next page.',
        positionals: [target()],
        options: { double: { type: 'boolean', desc: 'Double click' }, right: { type: 'boolean', desc: 'Right click' }, 'new-tab': { type: 'boolean', desc: 'Open the link in a new tab and switch to it' } },
        examples: [
            ['wdio session click e3', 'Click a ref from the latest snapshot'],
            ['wdio session click "aria/Add to cart"', 'Click by accessible name'],
            ['wdio session click e3 && wdio session wait --load networkidle && wdio session snapshot -i', 'Click, wait, look again'],
            ['wdio session click e8 --new-tab', 'Open a link in a new tab']
        ],
        seeAlso: ['tap', 'fill', 'wait', 'snapshot']
    },
    {
        name: 'tap', group: 'Interaction', applies: ['M'], mutation: true,
        desc: 'Tap an element (mobile)',
        positionals: [target()],
        examples: [['wdio session tap e2', 'Tap a ref from the latest snapshot']],
        seeAlso: ['click', 'long-press', 'swipe']
    },
    {
        name: 'fill', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true,
        desc: 'Replace the value of an input',
        details: 'Clears the field first. To type into whatever has focus, use `type`; to send keys like Enter, use `press`.',
        // variadic: `fill e2 Ada Lovelace` fills "Ada Lovelace" instead of failing on an unquoted space
        positionals: [target(), { name: 'text', desc: 'Text (words after the target are joined with spaces)', required: true, variadic: true }],
        examples: [
            ['wdio session fill e2 ada@example.com', 'Fill a field'],
            ['wdio session fill e2 ada@example.com && wdio session fill e4 secret && wdio session press Enter', 'Fill a form and submit it']
        ],
        seeAlso: ['type', 'press', 'select', 'check']
    },
    {
        name: 'type', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true,
        desc: 'Type into an element or the focused element',
        details: 'Sends the text as key presses without clearing anything: `type e2 Ada` types into e2, `type Ada` into whatever has focus. To replace a value, use `fill`.',
        positionals: [{ name: 'text', desc: 'Text (words are joined with spaces). Start with a ref, e.g. `type e2 Ada`, to type into that element instead of the focused one', required: true, variadic: true }],
        examples: [['wdio session type e5 hello', 'Type into a field'], ['wdio session focus e5 && wdio session type "hello"', 'Type into whatever has focus']],
        seeAlso: ['fill', 'press', 'focus']
    },
    {
        name: 'press', group: 'Interaction', applies: ['W', 'D'], mutation: true,
        desc: 'Press keys, e.g. Enter, Control+a',
        details: 'Combine keys with +. Names ignore case; ctrl, cmd, esc, up, down, left and right are accepted as short forms.',
        positionals: [{ name: 'keys', desc: 'Key combination', required: true }],
        examples: [
            ['wdio session press Enter', 'Submit a form'],
            ['wdio session press Control+a', 'Select all'],
            ['wdio session press Shift+Tab', 'Move focus back']
        ],
        seeAlso: ['type', 'fill']
    },
    {
        name: 'select', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Select an option of a <select>',
        positionals: [target(), { name: 'value', desc: 'Option text, value or index', required: true }],
        options: { by: { type: 'string', choices: ['text', 'value', 'index'], desc: 'How to match the option (default text)' } },
        examples: [
            ['wdio session select e6 Germany', 'Select by visible text'],
            ['wdio session select e6 de --by value', 'Select by value']
        ],
        seeAlso: ['fill', 'check']
    },
    {
        name: 'upload', group: 'Interaction', applies: ['W'], mutation: true,
        desc: 'Set a file input',
        details: 'The path is relative to your working directory. Target the <input type="file"> itself, not the button that opens the picker.',
        positionals: [target(), { name: 'file', desc: 'File to upload', required: true }],
        examples: [['wdio session upload e9 ./fixtures/avatar.png', 'Attach a file']],
        seeAlso: ['fill']
    },
    { name: 'hover', group: 'Interaction', applies: ['W', 'D'], mutation: true, desc: 'Move the pointer over an element', positionals: [target()], examples: [['wdio session hover e4 && wdio session snapshot -i', 'Open a hover menu and look at it']], seeAlso: ['click'] },
    { name: 'focus', group: 'Interaction', applies: ['W'], mutation: true, desc: 'Focus an element', positionals: [target()], examples: [['wdio session focus e5', 'Focus a field before `type`']], seeAlso: ['type', 'press'] },
    {
        name: 'check', group: 'Interaction', applies: ['W'], mutation: true,
        desc: 'Check a checkbox or radio',
        details: 'Does nothing when it is already checked, and fails when it does not end up checked.',
        positionals: [target()],
        examples: [['wdio session check e7', 'Accept the terms']],
        seeAlso: ['uncheck', 'is']
    },
    {
        name: 'uncheck', group: 'Interaction', applies: ['W'], mutation: true,
        desc: 'Uncheck a checkbox',
        details: 'Does nothing when it is already unchecked. A selected radio button cannot be unchecked.',
        positionals: [target()],
        examples: [['wdio session uncheck e7', 'Opt out of the newsletter']],
        seeAlso: ['check', 'is']
    },
    {
        name: 'drag', group: 'Interaction', applies: ['W', 'M', 'D'], mutation: true,
        desc: 'Drag an element onto another',
        positionals: [{ name: 'from', desc: 'Ref or selector to drag', required: true }, { name: 'to', desc: 'Ref or selector to drop on', required: true }],
        examples: [['wdio session drag e3 e9', 'Move a card to another column']],
        seeAlso: ['scroll']
    },
    {
        name: 'scroll', group: 'Interaction', applies: ['W'], mutation: true,
        desc: 'Scroll an element into view or the page',
        details: 'Without a target it scrolls down 600px. Lazy-loaded content shows up in the next snapshot.',
        positionals: [{ name: 'target', desc: 'Ref, selector, up, down, top or bottom' }],
        options: { px: { type: 'number', desc: 'Pixels for up/down (default 600)' } },
        examples: [
            ['wdio session scroll e40', 'Bring an element into view'],
            ['wdio session scroll bottom && wdio session snapshot -i', 'Load more results and look at them'],
            ['wdio session scroll down --px 1200', 'Scroll two screens']
        ],
        seeAlso: ['swipe', 'snapshot']
    },
    {
        name: 'swipe', group: 'Interaction', applies: ['M'], mutation: true,
        desc: 'Swipe the screen (mobile)',
        positionals: [{ name: 'direction', desc: 'up | down | left | right', required: true, choices: ['up', 'down', 'left', 'right'] }],
        options: { percent: { type: 'number', desc: 'Swipe length 0..1' } },
        examples: [['wdio session swipe up && wdio session snapshot', 'Scroll a list and look at it']],
        seeAlso: ['scroll', 'tap']
    },
    {
        name: 'long-press', group: 'Interaction', applies: ['M'], mutation: true,
        desc: 'Long press an element (mobile)',
        positionals: [target()],
        options: { duration: { type: 'number', desc: 'Milliseconds' } },
        examples: [['wdio session long-press e4 --duration 1500', 'Open a context menu']],
        seeAlso: ['tap']
    },

    /**
     * contexts
     */
    {
        name: 'tabs', group: 'Contexts', applies: ['W'],
        desc: 'List, open, switch or close tabs',
        details: 'Without a subcommand it lists tabs with their index; the current one is marked. `new` opens and switches to a tab. `switch` and `close` take an index or handle.',
        positionals: [{ name: 'sub', desc: 'switch | new | close', choices: ['switch', 'new', 'close'] }, { name: 'arg', desc: 'Index, handle or URL' }],
        examples: [
            ['wdio session tabs', 'List tabs'],
            ['wdio session tabs new http://localhost:3000/help', 'Open a tab'],
            ['wdio session tabs switch 0', 'Go back to the first tab'],
            ['wdio session tabs close 1', 'Close the second tab']
        ],
        seeAlso: ['windows', 'frame']
    },
    {
        name: 'windows', group: 'Contexts', applies: ['W', 'D'],
        desc: 'List or switch windows',
        positionals: [{ name: 'sub', desc: 'switch', choices: ['switch'] }, { name: 'arg', desc: 'Index or handle' }],
        examples: [
            ['wdio session windows', 'List windows'],
            ['wdio session windows switch 1', 'Switch to the second window']
        ],
        seeAlso: ['tabs']
    },
    {
        name: 'frame', group: 'Contexts', applies: ['W'], mutation: true,
        desc: 'Switch into an iframe, to the parent or to the top',
        details: 'Snapshots and actions apply to the current frame until you switch back. `navigate` returns to the top document.',
        positionals: [{ name: 'target', desc: 'Ref, selector, parent or top', required: true }],
        examples: [
            ['wdio session frame e12 && wdio session snapshot -i', 'Enter an iframe and look inside'],
            ['wdio session frame top', 'Go back to the page']
        ],
        seeAlso: ['tabs', 'snapshot']
    },
    {
        name: 'contexts', group: 'Contexts', applies: ['M'],
        desc: 'List or switch native/webview contexts',
        positionals: [{ name: 'sub', desc: 'switch', choices: ['switch'] }, { name: 'name', desc: 'Context name' }],
        examples: [
            ['wdio session contexts', 'List NATIVE_APP and WEBVIEW contexts'],
            ['wdio session contexts switch WEBVIEW_com.example.shop', 'Drive the webview']
        ],
        seeAlso: ['snapshot']
    },
    {
        name: 'dialog', group: 'Contexts', applies: ['W', 'M'], mutation: true,
        desc: 'Accept, dismiss or report an open dialog',
        details: 'An open alert, confirm or prompt blocks other actions, which fail with a hint to run this.',
        positionals: [{ name: 'sub', desc: 'accept | dismiss | status', required: true, choices: ['accept', 'dismiss', 'status'] }],
        options: { text: { type: 'string', desc: 'Prompt text (accept only)' } },
        examples: [
            ['wdio session dialog status', 'Show the open dialog'],
            ['wdio session dialog accept', 'Confirm'],
            ['wdio session dialog accept --text "Ada"', 'Answer a prompt']
        ],
        seeAlso: ['click']
    },

    /**
     * device
     */
    {
        name: 'app', group: 'Device', applies: ['M', 'D'], mutation: true,
        desc: 'Launch, terminate, install or query an app',
        positionals: [{ name: 'sub', desc: 'launch | terminate | install | state', required: true, choices: ['launch', 'terminate', 'install', 'state'] }, { name: 'id', desc: 'App id, bundle id or file', required: true }],
        examples: [
            ['wdio session app terminate com.example.shop && wdio session app launch com.example.shop', 'Restart the app'],
            ['wdio session app state com.example.shop', 'Is it running?']
        ],
        seeAlso: ['deeplink', 'background']
    },
    {
        name: 'deeplink', group: 'Device', applies: ['M'], mutation: true,
        desc: 'Open a deep link',
        positionals: [{ name: 'url', desc: 'URL', required: true }],
        options: { package: { type: 'string', desc: 'Android package or iOS bundle id' } },
        examples: [['wdio session deeplink shop://product/42 --package com.example.shop', 'Open a product screen']],
        seeAlso: ['app']
    },
    {
        name: 'rotate', group: 'Device', applies: ['M'], mutation: true,
        desc: 'Rotate the device',
        positionals: [{ name: 'orientation', desc: 'portrait | landscape', required: true, choices: ['portrait', 'landscape'] }],
        examples: [['wdio session rotate landscape', 'Turn the device sideways']]
    },
    {
        name: 'keyboard', group: 'Device', applies: ['M'], mutation: true,
        desc: 'Hide the on-screen keyboard',
        positionals: [{ name: 'sub', desc: 'hide', required: true, choices: ['hide'] }],
        examples: [['wdio session keyboard hide', 'Uncover the elements under the keyboard']]
    },
    {
        name: 'background', group: 'Device', applies: ['M'], mutation: true,
        desc: 'Send the app to the background',
        positionals: [{ name: 'seconds', desc: 'Seconds (-1 keeps it there)', required: true }],
        examples: [['wdio session background 3', 'Background the app for 3 seconds']],
        seeAlso: ['app']
    },
    { name: 'lock', group: 'Device', applies: ['M'], mutation: true, desc: 'Lock the device', examples: [['wdio session lock', 'Lock the screen']], seeAlso: ['unlock'] },
    { name: 'unlock', group: 'Device', applies: ['M'], mutation: true, desc: 'Unlock the device', examples: [['wdio session unlock', 'Unlock the screen']], seeAlso: ['lock'] },
    {
        name: 'geolocation', group: 'Device', applies: ['W', 'M'], mutation: true,
        desc: 'Set the geolocation',
        positionals: [{ name: 'lat', desc: 'Latitude', required: true }, { name: 'lon', desc: 'Longitude', required: true }],
        options: { accuracy: { type: 'number', desc: 'Accuracy in meters' } },
        examples: [['wdio session geolocation 52.52 13.405', 'Pretend to be in Berlin']],
        seeAlso: ['emulate']
    },

    /**
     * emulation
     */
    {
        name: 'emulate', group: 'Emulation', applies: ['W'], mutation: true,
        desc: 'Emulate a device, viewport, network, cpu, clock or a BiDi emulation scope',
        details: 'An emulation stays until `emulate reset` or the session ends; setting the same kind again replaces it. `emulate device` without a value lists the device names. Network presets and cpu throttling need a Chromium browser.',
        positionals: [
            { name: 'sub', desc: 'device | viewport | network | cpu | clock | color-scheme | user-agent | media | locale | timezone | touch | orientation | screen | viewport-meta | text-layout | scripting | scrollbar | forced-colors | reset', required: true, choices: ['device', 'viewport', 'network', 'cpu', 'clock', 'color-scheme', 'user-agent', 'media', 'locale', 'timezone', 'touch', 'orientation', 'screen', 'viewport-meta', 'text-layout', 'scripting', 'scrollbar', 'forced-colors', 'reset'] },
            { name: 'value', desc: 'Value for the emulation' }
        ],
        options: { dpr: { type: 'number', desc: 'Device pixel ratio (viewport)' }, tick: { type: 'number', desc: 'Advance the emulated clock by ms (clock)' } },
        examples: [
            ['wdio session emulate device "iPhone 15"', 'Emulate a phone'],
            ['wdio session emulate viewport 375x812 --dpr 3', 'Set a viewport'],
            ['wdio session emulate network offline', 'Go offline'],
            ['wdio session emulate color-scheme dark', 'Dark mode'],
            ['wdio session emulate clock 2030-01-01T00:00:00Z', 'Freeze the date'],
            ['wdio session emulate media prefersReducedMotion=reduce', 'Reduce motion'],
            ['wdio session emulate reset', 'Undo every emulation']
        ],
        seeAlso: ['geolocation', 'screenshot']
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
        },
        examples: [
            ['wdio session requests --filter "**/api/**"', 'API calls only'],
            ['wdio session click e3 && wdio session requests --failed --since 10s', 'Requests a click broke']
        ],
        seeAlso: ['mock', 'logs']
    },
    {
        name: 'mock', group: 'Network', applies: ['W'], mutation: true,
        desc: 'Mock responses for a URL pattern (BiDi)',
        details: 'Prints the mock id (m1, m2, …). Mocking the same pattern again replaces the earlier mock.',
        positionals: [{ name: 'pattern', desc: 'URL pattern', required: true }],
        options: {
            status: { type: 'number', desc: 'Status code' },
            body: { type: 'string', desc: 'Body as JSON/text or a file path' },
            header: { type: 'string', array: true, desc: 'Header k:v' },
            abort: { type: 'boolean', desc: 'Abort matching requests' },
            method: { type: 'string', desc: 'Only this method' },
            once: { type: 'boolean', desc: 'Only the next request' }
        },
        examples: [
            ['wdio session mock "**/api/user" --body \'{"name":"Mocked"}\'', 'Return fixed JSON'],
            ['wdio session mock "**/api/cart" --status 500 --once', 'Fail the next request'],
            ['wdio session mock "**/*.png" --abort', 'Block images']
        ],
        seeAlso: ['unmock', 'requests']
    },
    {
        name: 'unmock', group: 'Network', applies: ['W'], mutation: true,
        desc: 'Remove mocks',
        positionals: [{ name: 'pattern', desc: 'Pattern or mock id' }],
        options: { all: { type: 'boolean', desc: 'Remove all mocks' } },
        examples: [
            ['wdio session unmock m1', 'Remove one mock'],
            ['wdio session unmock --all', 'Remove every mock']
        ],
        seeAlso: ['mock']
    },

    /**
     * state
     */
    {
        name: 'cookies', group: 'State', applies: ['W'],
        desc: 'Get, set or clear cookies',
        details: 'Without a subcommand it prints every cookie as name=value. `clear` without a name deletes all cookies.',
        positionals: [{ name: 'sub', desc: 'get | set | clear', choices: ['get', 'set', 'clear'] }, { name: 'name', desc: 'Cookie name' }, { name: 'value', desc: 'Cookie value' }],
        options: {
            domain: { type: 'string', desc: 'Cookie domain (set)' },
            path: { type: 'string', desc: 'Cookie path (set)' },
            'http-only': { type: 'boolean', desc: 'HttpOnly cookie (set)' },
            secure: { type: 'boolean', desc: 'Secure cookie (set)' },
            'same-site': { type: 'string', desc: 'lax, strict, none or default (set)' },
            expiry: { type: 'number', desc: 'Expiry as a Unix timestamp in seconds (set)' }
        },
        examples: [
            ['wdio session cookies', 'List cookies'],
            ['wdio session cookies get session', 'Value of one cookie'],
            ['wdio session cookies set session abc && wdio session reload', 'Set a cookie and reload'],
            ['wdio session cookies clear', 'Delete all cookies']
        ],
        seeAlso: ['storage', 'state']
    },
    {
        name: 'storage', group: 'State', applies: ['W'],
        desc: 'Get, set or clear localStorage (or sessionStorage)',
        details: 'Without a subcommand it prints every entry. `clear` without a key empties the store.',
        positionals: [{ name: 'sub', desc: 'get | set | clear', choices: ['get', 'set', 'clear'] }, { name: 'key', desc: 'Key' }, { name: 'value', desc: 'Value' }],
        options: { 'session-storage': { type: 'boolean', desc: 'Use sessionStorage' } },
        examples: [
            ['wdio session storage', 'List localStorage'],
            ['wdio session storage set token abc', 'Set a key'],
            ['wdio session storage clear --session-storage', 'Empty sessionStorage']
        ],
        seeAlso: ['cookies', 'state']
    },
    {
        name: 'state', group: 'State', applies: ['W'], mutation: true,
        desc: 'Save or load cookies and storage',
        details: '`save` writes cookies, localStorage and sessionStorage of the current origin to a JSON file. `load` opens that origin and restores them, e.g. to skip a login.',
        positionals: [{ name: 'sub', desc: 'save | load', required: true, choices: ['save', 'load'] }, { name: 'file', desc: 'State file', required: true }],
        examples: [
            ['wdio session state save .wdio/logged-in.json', 'Save a logged-in state'],
            ['wdio session state load .wdio/logged-in.json && wdio session reload', 'Start logged in']
        ],
        seeAlso: ['cookies', 'storage']
    },

    /**
     * visual
     */
    {
        name: 'visual', group: 'Visual', applies: ['W', 'M', 'D'],
        desc: 'Visual snapshots through @wdio/visual-service',
        details: '`save` stores a baseline under .wdio/visual/baseline, `check` compares with it and prints the mismatch, `accept` turns the last actual image into the baseline, `list` shows the tags. Needs @wdio/visual-service in the project.',
        positionals: [{ name: 'sub', desc: 'save | check | accept | list', required: true, choices: ['save', 'check', 'accept', 'list'] }, { name: 'tag', desc: 'Image tag' }],
        options: {
            element: { type: 'string', desc: 'Only this element' },
            full: { type: 'boolean', desc: 'Full page' },
            tabbable: { type: 'boolean', desc: 'Tabbable page' },
            threshold: { type: 'number', desc: 'Allowed mismatch in percent (default 0)' },
            all: { type: 'boolean', desc: 'accept: every tag' }
        },
        examples: [
            ['wdio session visual save cart', 'Store a baseline'],
            ['wdio session visual check cart --threshold 0.5', 'Compare with it'],
            ['wdio session visual accept cart', 'Accept an intended change']
        ],
        seeAlso: ['screenshot']
    },

    /**
     * evidence
     */
    {
        name: 'trace', group: 'Evidence',
        desc: 'Record every step with screenshots and snapshots',
        details: '`stop` prints the trace directory and a transcript of the steps.',
        positionals: [{ name: 'sub', desc: 'start | stop', required: true, choices: ['start', 'stop'] }],
        options: {
            screenshots: { type: 'boolean', default: true, desc: 'Screenshot after each step (use --no-screenshots to skip)' },
            snapshots: { type: 'boolean', default: true, desc: 'Snapshot after each step (use --no-snapshots to skip)' }
        },
        examples: [
            ['wdio session trace start', 'Start tracing'],
            ['wdio session trace stop', 'Stop and print the transcript']
        ],
        seeAlso: ['record', 'history']
    },
    {
        name: 'record', group: 'Evidence', applies: ['W', 'M'],
        desc: 'Record a video',
        positionals: [{ name: 'sub', desc: 'start | stop', required: true, choices: ['start', 'stop'] }],
        options: { fps: { type: 'number', desc: 'Frames per second (default 5)' }, path: { type: 'string', desc: 'Output file' } },
        examples: [
            ['wdio session record start', 'Start recording'],
            ['wdio session record stop --path checkout.mp4', 'Stop and save the video']
        ],
        seeAlso: ['trace', 'screenshot']
    },
    {
        name: 'history', group: 'Evidence',
        desc: 'Print the recorded steps',
        details: 'Every action that changes the page records the WebdriverIO code it ran. `export` turns this history into a spec.',
        options: { clear: { type: 'boolean', desc: 'Clear the history' } },
        examples: [
            ['wdio session history', 'Show the steps so far'],
            ['wdio session history --clear', 'Start the recording over before the steps you want to keep']
        ],
        seeAlso: ['export', 'exec']
    },
    {
        name: 'export', group: 'Evidence',
        desc: 'Generate a spec from the history',
        details: 'Writes a describe/it spec with the recorded steps. Refs become stable selectors and helpers become custom commands. Without --out the file goes into the artifacts dir. Run it with `wdio run` to confirm it passes.',
        options: {
            out: { type: 'string', desc: 'Output file' },
            title: { type: 'string', desc: 'Suite title' },
            'page-objects': { type: 'boolean', desc: 'Generate page objects' },
            framework: { type: 'string', choices: ['mocha', 'jasmine'], desc: 'Framework (default mocha)' }
        },
        examples: [
            ['wdio session export --out test/specs/cart.e2e.ts', 'Write the spec'],
            ['wdio session export --out test/specs/cart.e2e.ts && npx wdio run wdio.conf.ts --spec test/specs/cart.e2e.ts', 'Write the spec and run it']
        ],
        seeAlso: ['history', 'helpers']
    },

    /**
     * bridge and tooling
     */
    {
        name: 'resume', group: 'Tooling',
        desc: 'Continue a test paused by wdio run --debug=agent',
        details: '`wdio run --debug=agent` pauses a failing test and exposes it as session debug-<worker>. Inspect it with any action, then resume. `close` on that session fails the test instead.',
        examples: [['wdio session -s debug-0-0 snapshot -i && wdio session -s debug-0-0 resume', 'Look at the paused test, then let it continue']],
        seeAlso: ['close', 'list']
    },
    {
        name: 'doctor', group: 'Tooling', local: true,
        desc: 'Check your environment',
        details: 'Prints one line per check with a fix for each failure. Exits 1 when a check fails.',
        positionals: [{ name: 'target', desc: 'Only check what this target needs' }],
        examples: [
            ['wdio session doctor', 'Check everything'],
            ['wdio session doctor android', 'Check what an Android session needs']
        ],
        seeAlso: ['open']
    },
    {
        name: 'skill', group: 'Tooling', local: true,
        desc: 'Print the agent skill',
        options: { install: { type: 'string', desc: 'Write it to .agents/skills/wdio-session/SKILL.md (or this dir)' } },
        examples: [
            ['wdio session skill', 'Print the skill'],
            ['wdio session skill --install .', 'Add it to this project']
        ]
    }
]

export const ACTION_MAP = new Map(ACTIONS.map((a) => [a.name, a]))

export function actionTimeout (name: string) {
    return ACTION_MAP.get(name)?.timeout ?? DEFAULT_ACTION_TIMEOUT
}
