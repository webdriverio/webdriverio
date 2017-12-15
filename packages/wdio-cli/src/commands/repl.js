export const command = 'repl <browserName>'
export const desc = 'Run WebDriver session in command line'

export const handler = (argv) => {
    const { browserName } = argv
    console.log('Run repl with', browserName) // eslint-disable-line no-console
    console.log('Not yet implemented') // eslint-disable-line no-console
    process.exit(0)

    // const params = validateConfig(DEFAULTS, options)
    // const client = remote(merge(args, {
    //     sync: true,
    //     desiredCapabilities: {
    //         browserName: browser
    //     }
    // })).init().catch((e) => {
    //     client.logger.logLevel = 'verbose'
    //     client.logger.error(e)
    //     throw e
    // })

    /**
     * try to enhance client object using wdio-sync (if installed). This enables a better API
     * handling due to the result enhancements done by wdio-sync
     */
    // try {
    //     const sync = require('wdio-sync')
    //     global.browser = {options: {sync: true}}
    //     sync.wrapCommands(client, [], [])
    //     global.$ = (...args) => client.element.apply(client, args)
    //     global.$$ = (...args) => client.elements.apply(client, args).value
    //     global.browser = client
    // } catch (e) { }
    //
    // client.debug().end().then(() => process.exit(0), (e) => {
    //     throw e
    // })
}
