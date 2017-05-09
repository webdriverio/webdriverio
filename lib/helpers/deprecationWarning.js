export default function deprecate (commandName) {
    if (!browser.options.deprecatedAlerts) return;
    console.warn(
        `WARNING: the "${commandName}" command will be deprecated soon. Please use a ` +
        'different command in order to avoid failures in your test after updating WebdriverIO.'
    )
}
