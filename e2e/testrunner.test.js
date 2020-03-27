import fs from 'fs'
import path from 'path'
import Launcher from '../packages/wdio-cli/src/launcher.js'

test('should allow to run multiple browser at once', async () => {
    const launcher = new Launcher(`${__dirname}/wdio/wdio.conf.js`)
    const failures = await launcher.run()
    const hasPassed = failures === 0

    /**
     * print log files for debugging if test fails
     */
    if (!hasPassed) {
        const rootPath = path.join(__dirname, 'wdio')
        const logFiles = fs.readdirSync(rootPath)
            // only log files
            .filter((file) => file.endsWith('.log'))

        for (const fileName of logFiles) {
            // eslint-disable-next-line no-console
            console.log(`\n========== LOG OUPUT ${fileName}`)
            // eslint-disable-next-line no-console
            console.log(fs.readFileSync(path.resolve(rootPath, fileName)).toString())
        }
    }

    expect(hasPassed).toBe(true)
})
