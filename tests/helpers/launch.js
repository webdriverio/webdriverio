import { getValue } from '../../packages/wdio-shared-store-service/build/index.js'
import Launcher from '../../packages/wdio-cli/build/launcher.js'

export default function launch (...args) {
    let errors
    if (!args[1].onComplete) {
        args[1].onComplete = async () => {
            errors = await getValue('*')
        }
    }

    const launcher = new Launcher(...args)
    return launcher.run().then(async (exitCode) => {
        const isFailing = exitCode !== 0
        if (!isFailing) {
            return { skippedSpecs: launcher.interface._skippedSpecs }
        }

        return { skippedSpecs: launcher.interface._skippedSpecs, errors }
    })
}
