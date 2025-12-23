import { resolve } from 'node:path'
import url from 'node:url'
import { resolve as resolveModule } from 'import-meta-resolve'
import { execSync, spawn, exec, type ChildProcessByStdio } from 'node:child_process'
import { type Readable } from 'node:stream'
import os from 'node:os'
import { promisify } from 'node:util'

const APPIUM_START_TIMEOUT = 30 * 1000

function extractPortFromArgs(args: string[]): number | null {
    const portArgIndex = args.findIndex((arg) => arg.startsWith('--port'))

    if (portArgIndex === -1) {
        return null
    }

    const portArg = args[portArgIndex]
    let portValue: string

    if (portArg.includes('=')) {
        // Format: --port=5555
        portValue = portArg.split('=')[1]
    } else {
        // Format: --port 5555
        const nextArg = args[portArgIndex + 1]
        if (!nextArg || nextArg.startsWith('--')) {
            throw new Error('Missing port value after --port flag.')
        }
        portValue = nextArg
    }

    const port = Number(portValue)
    if (Number.isInteger(port) && port >= 1 && port <= 65535) {
        return port
    }

    return null
}

export function extractPortFromCliArgs(args: string[]): number {
    return extractPortFromArgs(args) ?? 4723
}

async function tryResolveModule(command: string, from: string): Promise<string | null> {
    try {
        const entryPath = await resolveModule(command, from)

        return url.fileURLToPath(entryPath)
    } catch {
        return null
    }
}

export async function determineAppiumCliCommand(command = 'appium'): Promise<string> {
    const localNodeModules = resolve(process.cwd(), 'node_modules')
    const localPath = await tryResolveModule(command, url.pathToFileURL(localNodeModules).toString())

    if (localPath) {
        return localPath
    }

    const packagePath = await tryResolveModule(command, import.meta.url)

    if (packagePath) {
        return packagePath
    }

    try {
        const npmPrefix = execSync('npm config get prefix', { encoding: 'utf-8' }).trim()
        const globalNodeModules = resolve(npmPrefix, 'lib', 'node_modules')
        const globalPath = await tryResolveModule(command, url.pathToFileURL(globalNodeModules).toString())
        if (globalPath) {
            return globalPath
        }
    } catch {
        // npm config get prefix failed, continue to throw error below
    }

    throw new Error(
        'Appium is not installed. Please install it globally via `npm install -g appium`\n' +
        'or locally in your project via `npm i --save-dev appium`. Do not forget to also\n' +
        'install the drivers for your platform.'
    )
}

export async function checkInspectorPluginInstalled(appiumCommandPath: string): Promise<void> {
    const INSPECTOR_PLUGIN_DOCS_URL = 'https://appium.github.io/appium-inspector/latest/quickstart/installation/#appium-plugin'
    const helpMessage = `Please check this link for more information: ${INSPECTOR_PLUGIN_DOCS_URL}`

    try {
        // Using --installed flag returns only installed plugins
        const { stdout, stderr } = await promisify(exec)(`${appiumCommandPath} plugin list --installed`, {
            encoding: 'utf-8'
        })

        // Appium outputs plugin list to stderr, not stdout
        const output = stderr || stdout
        if (!output || output.trim().length === 0) {
            throw new Error(
                `Appium Inspector plugin is not installed. ${helpMessage}`
            )
        }

        const lines = output.split('\n')
        const inspectorLine = lines.find(line => /^-.*inspector/i.test(line.trim()))

        if (!inspectorLine) {
            throw new Error(
                `Appium Inspector plugin is not installed. ${helpMessage}`
            )
        }
    } catch (err) {
        if (err instanceof Error && !err.message.includes('Inspector plugin')) {
            throw new Error(
                `Failed to check Appium Inspector plugin installation: ${err.message}. ${helpMessage}`
            )
        }
        throw err
    }
}

export async function startAppiumForCli(
    appiumCommandPath: string,
    args: string[],
    timeout = APPIUM_START_TIMEOUT
): Promise<ChildProcessByStdio<null, Readable, Readable>> {
    let command = 'node'
    const appiumArgs = [appiumCommandPath, ...args]

    if (os.platform() === 'win32') {
        appiumArgs.unshift('/c', command)
        command = 'cmd'
    }

    const appiumProcess: ChildProcessByStdio<null, Readable, Readable> = spawn(command, appiumArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
    })
    // just to validate the first error
    let errorCaptured = false
    // to set a timeout for the promise
    let timeoutId: NodeJS.Timeout
    // to store the first error message
    let error: string

    return new Promise<ChildProcessByStdio<null, Readable, Readable>>((resolvePromise, reject) => {
        let outputBuffer = ''

        /**
         * set timeout for promise. If Appium does not start within given timeout,
         * e.g. if the port is already in use, reject the promise.
         */
        timeoutId = setTimeout(() => {
            rejectOnce(new Error('Timeout: Appium did not start within expected time'))
        }, timeout)

        /**
         * reject promise if Appium does not start within given timeout,
         * e.g. if the port is already in use
         *
         * @param err - error to reject with
         */
        const rejectOnce = (err: Error) => {
            if (!errorCaptured) {
                errorCaptured = true
                clearTimeout(timeoutId)
                reject(err)
            }
        }

        /**
         * only capture first error to print it in case Appium failed to start.
         */
        const onErrorMessage = (data: Buffer) => {
            const message = data.toString()

            const isDebuggerMessage = message.includes('Debugger attached') ||
                message.includes('Debugger listening on') ||
                message.includes('For help, see: https://nodejs.org/en/docs/inspector')

            if (isDebuggerMessage) {
                return
            }

            if (!errorCaptured) {
                error = message || 'Appium exited without error message'

                /**
                 * Check if the message is a warning (not an actual error)
                 * Warnings should be logged but not cause the service to fail
                 */
                const isWarning = message.trim().startsWith('WARN')

                /**
                 * Don't reject on warnings - this is the fix for issue #14770
                 * Continue to reject on all other stderr output for backward compatibility
                 */
                if (!isWarning) {
                    rejectOnce(new Error(error))
                    return
                }
            }

            // Write all stderr to console (keep listener attached for continuous logging)
            process.stderr.write(message)
        }

        const onStdout = (data: Buffer) => {
            outputBuffer += data.toString()
            // Write to console immediately (keep listener attached for continuous logging)
            process.stdout.write(data.toString())

            if (outputBuffer.includes('Appium REST http interface listener started')) {
                outputBuffer = ''
                clearTimeout(timeoutId)
                // Don't remove listeners - keep them so logs continue to stream
                resolvePromise(appiumProcess)
            }
        }

        appiumProcess.stdout.on('data', onStdout)
        appiumProcess.stderr.on('data', onErrorMessage)
        appiumProcess.once('exit', (exitCode: number) => {
            let errorMessage = `Appium exited before timeout (exit code: ${exitCode})`
            if (exitCode === 2) {
                errorMessage += '\n' + (error?.toString() || 'Check that you don\'t already have a running Appium service.')
            } else if (errorCaptured) {
                errorMessage += `\n${error?.toString()}`
            }
            if (exitCode !== 0) {
                console.error(errorMessage)
            }
            rejectOnce(new Error(errorMessage))
        })
    })
}

export async function openBrowser(url: string): Promise<void> {
    console.log('🌐 Opening Appium Inspector in your default browser...')

    let command: string
    const platform = os.platform()

    if (platform === 'win32') {
        command = `start "" "${url}"`
    } else if (platform === 'darwin') {
        command = `open "${url}"`
    } else {
        command = `xdg-open "${url}"`
    }

    try {
        execSync(command, { stdio: 'ignore' })
        console.log('✅ Opened Appium Inspector in your default browser.')
    } catch {
        console.warn(`⚠️ Automatically starting the default browser didn't work, please open your favorite browser and paste the url '${url}' in there`)
    }
}
