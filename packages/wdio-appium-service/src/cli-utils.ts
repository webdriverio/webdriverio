import { resolveOptionalDependency } from '@wdio/utils/node'
import { execSync, spawn, execFile, type ChildProcessByStdio } from 'node:child_process'
import { type Readable } from 'node:stream'
import fs from 'node:fs'
import os from 'node:os'
import readline from 'node:readline/promises'
import { promisify } from 'node:util'

const APPIUM_START_TIMEOUT = 30 * 1000
const INSPECTOR_PLUGIN_PACKAGE = 'appium-inspector-plugin'

class InspectorPluginNotInstalledError extends Error {}

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

/**
 * Removes any existing --port argument from the args array.
 * Handles both --port=5555 and --port 5555 formats.
 * @param args - Array of command line arguments
 */
export function removePortFromArgs(args: string[]): void {
    // Iterate backwards to avoid index issues when removing items
    for (let i = args.length - 1; i >= 0; i--) {
        if (args[i].startsWith('--port')) {
            const portArg = args[i]
            if (portArg.includes('=')) {
                // Format: --port=5555, remove just this one argument
                args.splice(i, 1)
            } else {
                // Format: --port 5555, remove both --port and the next argument
                args.splice(i, 2)
            }
        }
    }
}

export async function determineAppiumCliCommand(command = 'appium'): Promise<string> {
    const resolved = await resolveOptionalDependency(command, { from: import.meta.url, global: true })
    if (resolved) {
        return resolved
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
        const { stdout, stderr } = await promisify(execFile)('node', [appiumCommandPath, 'plugin', 'list', '--installed'], {
            encoding: 'utf-8'
        })

        // Appium outputs plugin list to stderr, not stdout
        const output = stderr || stdout
        if (!output || output.trim().length === 0) {
            throw new InspectorPluginNotInstalledError(
                `Appium Inspector plugin is not installed. ${helpMessage}`
            )
        }

        const lines = output.split('\n')
        const inspectorLine = lines.find(line => /^-.*inspector/i.test(line.trim()))

        if (!inspectorLine) {
            throw new InspectorPluginNotInstalledError(
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

type InstallChoice = 'dependency' | 'appium' | null

async function askInstallChoice(): Promise<InstallChoice> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    try {
        const answer = await rl.question(
            '❓ The Appium Inspector plugin is not installed. How do you want to install it?\n' +
            '   1) Add it to this project as a dev dependency (saved in package.json)\n' +
            '   2) Install it into Appium only (not saved, repeat on every machine)\n' +
            '   3) Do not install\n' +
            'Choice (1/2/3, default 1): '
        )
        switch (answer.trim()) {
        case '':
        case '1':
            return 'dependency'
        case '2':
            return 'appium'
        default:
            return null
        }
    } finally {
        rl.close()
    }
}

function getPackageManagerAddCommand(): [string, string[]] {
    if (fs.existsSync('pnpm-lock.yaml')) {
        return ['pnpm', ['add', '-D']]
    }
    if (fs.existsSync('yarn.lock')) {
        return ['yarn', ['add', '-D']]
    }
    if (fs.existsSync('bun.lock') || fs.existsSync('bun.lockb')) {
        return ['bun', ['add', '-d']]
    }
    return ['npm', ['install', '--save-dev']]
}

function runInstall(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const installProcess = spawn(command, args, { stdio: 'inherit', shell: os.platform() === 'win32' })
        installProcess.once('error', reject)
        installProcess.once('exit', (exitCode) => {
            if (exitCode === 0) {
                return resolve()
            }
            reject(new Error(`Installing the Appium Inspector plugin failed (exit code: ${exitCode})`))
        })
    })
}

function installInspectorPlugin(appiumCommandPath: string, choice: 'dependency' | 'appium'): Promise<void> {
    if (choice === 'dependency') {
        const [command, args] = getPackageManagerAddCommand()
        return runInstall(command, [...args, INSPECTOR_PLUGIN_PACKAGE])
    }
    return runInstall('node', [appiumCommandPath, 'plugin', 'install', '--source=npm', INSPECTOR_PLUGIN_PACKAGE])
}

/**
 * Checks for the Inspector plugin and, in an interactive terminal, offers to install it
 * when it is missing. Without a TTY the original error is thrown.
 */
export async function ensureInspectorPluginInstalled(appiumCommandPath: string): Promise<void> {
    let choice: InstallChoice
    try {
        return await checkInspectorPluginInstalled(appiumCommandPath)
    } catch (err) {
        if (!(err instanceof InspectorPluginNotInstalledError) || !process.stdin.isTTY) {
            throw err
        }
        choice = await askInstallChoice()
        if (!choice) {
            throw err
        }
    }

    console.log('📦 Installing the Appium Inspector plugin...')
    await installInspectorPlugin(appiumCommandPath, choice)
    await checkInspectorPluginInstalled(appiumCommandPath)
    console.log('✅ Appium Inspector plugin installed.')
}

export async function startAppiumForCli(
    appiumCommandPath: string,
    args: string[],
    timeout = APPIUM_START_TIMEOUT
): Promise<ChildProcessByStdio<null, Readable, Readable>> {
    const appiumProcess: ChildProcessByStdio<null, Readable, Readable> = spawn('node', [appiumCommandPath, ...args], {
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
         * Appium writes all log output (debug, info, warn, error) to stderr, so we cannot
         * distinguish real errors from normal log output in the data handler.
         * Accumulate stderr for error reporting and let the exit/timeout handlers detect failures.
         */
        const onErrorMessage = (data: Buffer) => {
            const message = data.toString()

            const isDebuggerMessage = message.includes('Debugger attached') ||
                message.includes('Debugger listening on') ||
                message.includes('For help, see: https://nodejs.org/en/docs/inspector')

            if (isDebuggerMessage) {
                return
            }

            error = (error || '') + message
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
                errorMessage += '\n' + (error || 'Check that you don\'t already have a running Appium service.')
            } else if (error) {
                errorMessage += `\n${error}`
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
