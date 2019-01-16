import fs from 'fs'
import path from 'path'

import Launcher from '../../packages/wdio-cli/src/launcher.js'

export default function launch (...args) {
    const launcher = new Launcher(...args)

    return launcher.run().then((isFailing) => {
        if (!isFailing) {
            // eslint-disable-next-line no-console
            console.log('Smoke test successful')
            return
        }

        const logFiles = fs.readdirSync(__dirname).filter((file) => file.endsWith('.log'))
        for (const fileName of logFiles) {
            // eslint-disable-next-line no-console
            console.log(`\n========== LOG OUPUT ${fileName}`)
            // eslint-disable-next-line no-console
            console.log(fs.readFileSync(path.resolve(__dirname, fileName)).toString())
        }

        throw new Error('Smoke test failed')
    })
}
