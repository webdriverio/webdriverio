import { checkInspectorPluginInstalled, determineAppiumCliCommand, extractPortFromCliArgs, openBrowser, startAppiumForCli } from './cli-utils.js'
import treeKill from 'tree-kill'
import { promisify } from 'node:util'

const promisifiedTreeKill = promisify<number, string>(treeKill)

export async function run() {
    const args: string[] = process.argv.slice(2)
    const port = extractPortFromCliArgs(args)
    const requiredFlags = ['--log-timestamp', '--use-plugins=inspector', '--allow-cors']

    args.push(`--port=${port}`)

    requiredFlags.forEach(flag => {
        if (!args.includes(flag)) {
            args.push(flag)
        }
    })

    const command = await determineAppiumCliCommand()
    const serverArgs = ['server', ...args]

    console.log('⏳ Checking inspector plugin...')
    await checkInspectorPluginInstalled(command)

    console.log('🚀 Starting Appium server...')
    console.log(`📡 Command: ${command} ${serverArgs.join(' ')}`)
    console.log('⏳ Waiting for Appium server to be ready...')
    console.log('ℹ️  Press Ctrl+C to stop Appium server and exit\n\n')

    const appiumProcess = await startAppiumForCli(command, serverArgs)

    await openBrowser(`http://localhost:${port}/inspector`)

    let isCleaningUp = false
    const cleanup = async () => {
        if (isCleaningUp) {
            return
        }
        isCleaningUp = true

        if (appiumProcess && appiumProcess.pid) {
            console.log('\n🛑 Stopping Appium server...')
            try {
                await promisifiedTreeKill(appiumProcess.pid, 'SIGTERM')
                console.log('✅ Appium server stopped successfully')
            } catch (err) {
                console.error('Error stopping Appium:', err)
            }
        }
        // Remove signal handlers before exiting to prevent duplicate handlers if run() is called again
        process.removeListener('SIGINT', cleanup)
        process.removeListener('SIGTERM', cleanup)
        process.exit(0)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.stdin.resume()
}
