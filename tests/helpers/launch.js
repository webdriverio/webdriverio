import Launcher from '../../packages/wdio-cli/build/launcher.js'

export default function launch (testName, ...args) {
    const launcher = new Launcher(...args)
    return launcher.run().then(async (exitCode) => {
        const isFailing = exitCode !== 0
        if (!isFailing) {
            return {
                passed: launcher.interface.result.passed,
                skippedSpecs: launcher.interface._skippedSpecs,
                failed: launcher.interface.result.failed
            }
        }

        throw new Error(`Smoke test "${testName}" failed`)
    })
}
