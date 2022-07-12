import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'

import { getValue } from '../../packages/wdio-shared-store-service/build/index.js'
import Launcher from '../../packages/wdio-cli/build/launcher.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default function launch (...args) {
    let errors
    args[1].onComplete = async () => {
        errors = await getValue('*')
    }
    const launcher = new Launcher(...args)

    return launcher.run().then(async (exitCode) => {
        const isFailing = exitCode !== 0
        if (!isFailing) {
            // eslint-disable-next-line no-console
            console.log('Smoke test successful')
            return { skippedSpecs: launcher.interface._skippedSpecs }
        }

        const IGNORED_FILES_TO_LOG = ['service.log', 'launcher.log']
        const logFiles = fs.readdirSync(__dirname).filter((file) => (
            // only log files
            file.endsWith('.log') &&
            // ignore service logs as they are only used for assertions
            !IGNORED_FILES_TO_LOG.includes(file)
        ))
        for (const fileName of logFiles) {
            // eslint-disable-next-line no-console
            console.log(`\n========== LOG OUPUT ${fileName}`)
            // eslint-disable-next-line no-console
            console.log(fs.readFileSync(path.resolve(__dirname, fileName)).toString())
        }

        console.log('Smoke test failed')
        return { skippedSpecs: launcher.interface._skippedSpecs, errors }
    })
}
