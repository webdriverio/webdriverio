export default {
    '/session/:sessionId/moz/screenshot/full': {
        GET: {
            command: 'fullPageScreenshot',
            description: 'Captures a screenshot of the entire page.',
            ref: 'https://phabricator.services.mozilla.com/source/mozilla-central/browse/default/testing/geckodriver/src/command.rs$43-46',
            parameters: [],
            returns: {
                type: 'String',
                name: 'screenshot',
                description:
                    'The base64-encoded PNG image data comprising the screenshot of the full page.',
            },
        },
    },
    '/session/:sessionId/moz/context': {
        GET: {
            command: 'getMozContext',
            description:
                'Get the context that is currently in effect, e.g. `CHROME` or `CONTENT`.',
            ref: 'https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L615-L622',
            examples: [
                [
                    "console.log(await browser.getMozContext()); // outputs: 'CHROME'",
                ],
            ],
            parameters: [],
            returns: {
                type: 'String',
                name: 'Context',
                description:
                    'The browser context, either `CHROME` or `CONTENT`',
            },
        },
        POST: {
            command: 'setMozContext',
            description:
                'Changes target context for commands between chrome- and content.<br /><br />Changing the current context has a stateful impact on all subsequent commands. The `CONTENT` context has normal web platform document permissions, as if you would evaluate arbitrary JavaScript. The `CHROME` context gets elevated permissions that lets you manipulate the browser chrome itself, with full access to the XUL toolkit.',
            ref: 'https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L615-L645',
            examples: [
                [
                    "console.log(await browser.getMozContext()); // outputs: 'CHROME'",
                    "browser.setMozContext('CONTENT');",
                    "console.log(await browser.getMozContext()); // outputs: 'CONTENT'",
                ],
            ],
            parameters: [
                {
                    name: 'context',
                    type: 'string',
                    description:
                        'The browser context, either `CHROME` or `CONTENT`',
                    required: true,
                },
            ],
        },
    },
    '/session/:sessionId/moz/addon/install': {
        POST: {
            command: 'installAddOn',
            description:
                'Installs a new addon with the current session. This function will return an ID that may later be used to uninstall the addon using `uninstallAddon`.',
            ref: 'https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L647-L668',
            examples: [
                [
                    '// Create a buffer of the add on .zip file',
                    "const extension = await fs.promises.readFile('/path/to/extension.zip')",
                    '// Load extension in Firefox',
                    "const id = await browser.installAddOn(extension.toString('base64'), false);",
                ],
            ],
            parameters: [
                {
                    name: 'addon',
                    type: 'string',
                    description: 'base64 string of the add on file',
                    required: true,
                },
                {
                    name: 'temporary',
                    type: 'boolean',
                    description:
                        'temporary Flag indicating whether the extension should be installed temporarily - gets removed on restart',
                    required: true,
                },
            ],
            returns: {
                type: 'String',
                name: 'id',
                description:
                    'A promise that will resolve to an ID for the newly installed addon.',
            },
        },
    },
    '/session/:sessionId/moz/addon/uninstall': {
        GET: {
            command: 'uninstallAddOn',
            description:
                "Uninstalls an addon from the current browser session's profile.",
            ref: 'https://github.com/SeleniumHQ/selenium/blob/586affe0cf675b1d5c8abc756defa4a46d95391b/javascript/node/selenium-webdriver/firefox.js#L670-L687',
            examples: [
                [
                    '// Create a buffer of the add on .zip file',
                    "const extension = await fs.promises.readFile('/path/to/extension.zip')",
                    '// Load extension in Firefox',
                    "const id = await browser.installAddOn(extension.toString('base64'), false);",
                    '// ...',
                    'await browser.uninstallAddOn(id)',
                ],
            ],
            parameters: [
                {
                    name: 'id',
                    type: 'string',
                    description: 'id ID of the addon to uninstall.',
                    required: true,
                },
            ],
        },
    },
}
