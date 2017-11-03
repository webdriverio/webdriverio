export default function deprecate (commandName, deprecationWarnings, note) {
    if (!deprecationWarnings) {
        return
    }

    console.warn(
        `WARNING: the "${commandName}" command will be deprecated soon. If you have further ` +
        'questions, reach out in the WebdriverIO Gitter support channel (https://gitter.im/webdriverio/webdriverio).\n' +
        `Note: ${note}\n\n` +
        '(You can disable this warning by setting `"deprecationWarnings": false` in ' +
        'your WebdriverIO config)'
    )
}
