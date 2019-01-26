import path from 'path'
import launch from './helpers/launch'

(async () => {
    /**
     * normal wdio testrunner tests
     */
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        { specs: [path.resolve(__dirname, 'mocha', 'test.js')] })

    /**
     * multiremote wdio testrunner tests
     */
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'multiremote', 'test.js')],
            capabilities: {
                browserA: {
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
                    capabilities: { browserName: 'chrome' }
                }
            }
        }
    )

    /**
     * for some reason the process get stuck therefor exit it
     */
    process.exit(0)
})().catch((e) => {
    // eslint-disable-next-line no-console
    console.log(e.stack)

    process.exit(1)
})
