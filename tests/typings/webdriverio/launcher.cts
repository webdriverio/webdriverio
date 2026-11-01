import { Launcher, type LauncherResult } from '@wdio/cli'

async function consumeLauncherResult() {
    const result = await new Launcher('./wdio.conf.js').run()
    const typed: LauncherResult = result
    const numbers: number[] = [result.exitCode, result.duration, result.tests.passed, result.specs.retries]
    // @ts-expect-error v10 returns a structured result, not a scalar exit code
    const legacyExitCode: number = result
    return { typed, numbers, legacyExitCode }
}

void consumeLauncherResult
